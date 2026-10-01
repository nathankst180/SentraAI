"""
Rawbank Sentient Fraud Intelligence Platform - Dual Retrieval Layer
File: backend/retrieval.py
Implements both:
1. Structured Retrieval: Deterministic Pandas + RapidFuzz queries for customer baselines,
   device link graphs, beneficiary fan-in networks, and velocity metrics.
2. Semantic Retrieval: SentenceTransformers ("intfloat/multilingual-e5-small") + FAISS IndexFlatL2
   vector index cached with SHA-256 validation.
"""

import os
import json
import time
import hashlib
import threading
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

try:
    import faiss
    from sentence_transformers import SentenceTransformer
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

from rapidfuzz import process, fuzz

CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "RAWBANK_SENTIENT_KB.csv"))
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "cache"))


class SentientRetrievalEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SentientRetrievalEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, csv_path: str = CSV_PATH):
        if getattr(self, "_initialized", False):
            return

        self.csv_path = csv_path
        self.cache_dir = CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)

        print(f"[*] Ingesting Master Knowledge Base into Retrieval Engine: {self.csv_path}")
        self.df = pd.read_csv(self.csv_path, low_memory=False)
        self.kb_sha256 = self._compute_sha256(self.csv_path)

        # Lazy-loaded semantic search assets
        self.model: Optional[SentenceTransformer] = None
        self.faiss_index: Optional[faiss.IndexFlatL2] = None
        self.passages: List[Dict[str, Any]] = []
        self._init_semantic_index()

        self._initialized = True
        print(f"[+] Retrieval Engine initialized with {len(self.df)} transactions.")

    @staticmethod
    def _compute_sha256(filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    # =========================================================================
    # 1. STRUCTURED RETRIEVAL (Deterministic Pandas + RapidFuzz)
    # =========================================================================

    def get_transaction(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Exact lookup for a single transaction by ID with smart prefix/alias tolerance (e.g. TX-01923)."""
        txn_clean = transaction_id.strip()
        matched = self.df[self.df["transaction_id"] == txn_clean]
        if matched.empty:
            # Try case-insensitive
            matched = self.df[self.df["transaction_id"].str.upper() == txn_clean.upper()]
        if matched.empty:
            # Smart tolerance: extract digits e.g. 'TX-01923' -> 1923 -> 'TXN-SYN0001923'
            digits = "".join(filter(str.isdigit, txn_clean))
            if digits:
                try:
                    int_val = int(digits)
                    canonical_id = f"TXN-SYN{int_val:07d}"
                    matched = self.df[self.df["transaction_id"] == canonical_id]
                except Exception:
                    pass
        if matched.empty:
            return None
        row = matched.iloc[0].to_dict()
        return self._clean_dict(row)

    def get_customer_baseline(self, customer_id: str) -> Dict[str, Any]:
        """Calculates exact 90-day baseline, transaction count, median, and alert history."""
        cust_txns = self.df[self.df["customer_id"] == customer_id]
        if cust_txns.empty:
            return {"error": f"Customer '{customer_id}' not found"}

        first_row = cust_txns.iloc[0]
        amounts = cust_txns["amount_usd_equiv"].dropna()
        alerts = cust_txns[cust_txns["alert_generated_flag"] == True]

        return {
            "customer_id": customer_id,
            "customer_name": str(first_row.get("customer_name", "UNKNOWN")),
            "customer_segment": str(first_row.get("customer_segment", "UNKNOWN")),
            "customer_type": str(first_row.get("customer_type", "RETAIL")),
            "kyc_risk_band": str(first_row.get("kyc_risk_band", "LOW")),
            "pep_flag": bool(first_row.get("pep_flag", False)),
            "home_province": str(first_row.get("home_province", "Kinshasa")),
            "home_city": str(first_row.get("home_city", "Kinshasa")),
            "total_transactions": len(cust_txns),
            "total_alerts": len(alerts),
            "median_usd_90d": round(float(amounts.median()), 2) if not amounts.empty else 0.0,
            "avg_usd_90d": round(float(amounts.mean()), 2) if not amounts.empty else 0.0,
            "max_usd": round(float(amounts.max()), 2) if not amounts.empty else 0.0,
            "min_usd": round(float(amounts.min()), 2) if not amounts.empty else 0.0,
            "monthly_inflow_usd": float(first_row.get("monthly_inflow_usd_equiv", 0.0)),
            "channels_used": sorted(cust_txns["channel"].dropna().unique().tolist()),
            "devices_used": sorted(cust_txns["device_id"].dropna().unique().tolist()),
        }

    def get_device_graph(self, device_id: str) -> Dict[str, Any]:
        """Retrieves hardware profile and all distinct customer accounts linked to device."""
        if not device_id or pd.isna(device_id) or device_id in ["NONE", ""]:
            return {"device_id": "NONE", "status": "NO_DEVICE_TRACKED"}

        dev_txns = self.df[self.df["device_id"] == device_id]
        if dev_txns.empty:
            return {"device_id": device_id, "status": "UNRECOGNIZED_DEVICE"}

        first_row = dev_txns.iloc[0]
        linked_customers = dev_txns[["customer_id", "customer_name", "customer_segment"]].drop_duplicates().to_dict(orient="records")
        alerts = dev_txns[dev_txns["alert_generated_flag"] == True]

        return {
            "device_id": device_id,
            "device_type": str(first_row.get("device_type", "UNKNOWN")),
            "device_os": str(first_row.get("device_os", "UNKNOWN")),
            "first_seen_days": int(first_row.get("device_first_seen_days", 0)) if not pd.isna(first_row.get("device_first_seen_days")) else 0,
            "trusted_flag": bool(first_row.get("device_trusted_flag", False)),
            "accounts_seen_30d": int(first_row.get("device_accounts_seen_30d", len(linked_customers))),
            "total_transactions_on_device": len(dev_txns),
            "total_alerts_on_device": len(alerts),
            "is_shared_device_anomaly": len(linked_customers) >= 3,
            "linked_accounts": linked_customers,
            "ip_countries_seen": sorted(dev_txns["ip_country"].dropna().unique().tolist()),
            "cities_seen": sorted(dev_txns["txn_city"].dropna().unique().tolist()),
        }

    def get_beneficiary_network(self, beneficiary_id: str) -> Dict[str, Any]:
        """Retrieves beneficiary profile, counterparty fan-in velocity, and distinct senders."""
        if not beneficiary_id or pd.isna(beneficiary_id) or beneficiary_id in ["NONE", ""]:
            return {"beneficiary_id": "NONE", "status": "NO_BENEFICIARY"}

        ben_txns = self.df[self.df["beneficiary_id"] == beneficiary_id]
        if ben_txns.empty:
            return {"beneficiary_id": beneficiary_id, "status": "NEW_UNSEEN_BENEFICIARY"}

        first_row = ben_txns.iloc[0]
        senders = ben_txns[["customer_id", "customer_name"]].drop_duplicates().to_dict(orient="records")
        alerts = ben_txns[ben_txns["alert_generated_flag"] == True]
        total_received = ben_txns["amount_usd_equiv"].sum()

        distinct_sender_count = int(first_row.get("beneficiary_distinct_sender_count_30d", len(senders)))
        return {
            "beneficiary_id": beneficiary_id,
            "beneficiary_name": str(first_row.get("beneficiary_name", "UNKNOWN")),
            "beneficiary_type": str(first_row.get("beneficiary_type", "UNKNOWN")),
            "beneficiary_relationship": str(first_row.get("beneficiary_relationship", "NONE")),
            "beneficiary_age_days": int(first_row.get("beneficiary_age_days", 0)) if not pd.isna(first_row.get("beneficiary_age_days")) else 0,
            "total_received_usd": round(float(total_received), 2),
            "total_transactions": len(ben_txns),
            "distinct_sender_count_30d": distinct_sender_count,
            "is_mule_fanin_suspect": distinct_sender_count >= 5,
            "total_alerts": len(alerts),
            "senders": senders[:10],
        }

    def fuzzy_search_entities(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Uses RapidFuzz to find matching customer names, beneficiary names, or transaction IDs."""
        q = query.strip()
        if not q:
            return []

        # Check exact txn match first
        exact_txn = self.df[self.df["transaction_id"].str.upper() == q.upper()]
        if not exact_txn.empty:
            r = exact_txn.iloc[0]
            return [{
                "entity_type": "transaction",
                "id": r["transaction_id"],
                "name": f"Transaction {r['transaction_id']} (${r['amount_usd_equiv']:,.2f})",
                "score": 100.0,
            }]

        # Fuzzy match against unique customer names
        cust_choices = self.df["customer_name"].dropna().unique().tolist()
        cust_matches = process.extract(q, cust_choices, scorer=fuzz.token_set_ratio, limit=limit)

        # Fuzzy match against unique beneficiary names
        ben_choices = self.df["beneficiary_name"].dropna().unique().tolist()
        ben_matches = process.extract(q, ben_choices, scorer=fuzz.token_set_ratio, limit=limit)

        results = []
        for name, score, _ in cust_matches:
            if score >= 60:
                row = self.df[self.df["customer_name"] == name].iloc[0]
                results.append({
                    "entity_type": "customer",
                    "id": row["customer_id"],
                    "name": f"{name} ({row['customer_segment']})",
                    "score": round(score, 1)
                })

        for name, score, _ in ben_matches:
            if score >= 60 and name not in ["NONE", ""]:
                row = self.df[self.df["beneficiary_name"] == name].iloc[0]
                results.append({
                    "entity_type": "beneficiary",
                    "id": row["beneficiary_id"],
                    "name": f"{name} (Beneficiary)",
                    "score": round(score, 1)
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

    # =========================================================================
    # 2. SEMANTIC RETRIEVAL (multilingual-e5-small + FAISS or Sklearn TF-IDF)
    # =========================================================================

    def _init_semantic_index(self):
        """Builds or loads cached vector index with SHA-256 validation."""
        self.passages = self._generate_passage_cards()

        if not FAISS_AVAILABLE:
            print("[*] FAISS/SentenceTransformers not present. Initializing fast TF-IDF Semantic Index...")
            card_texts = [p["card_text"] for p in self.passages]
            self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(card_texts)
            self.faiss_index = None
            print(f"[+] TF-IDF semantic matrix built for {len(self.passages)} passage cards.")
            return

        index_file = os.path.join(self.cache_dir, "faiss_index.bin")
        passages_file = os.path.join(self.cache_dir, "faiss_passages.json")
        sha_file = os.path.join(self.cache_dir, "faiss_kb_sha256.txt")

        # Check if cache exists and matches KB SHA-256
        if os.path.exists(index_file) and os.path.exists(passages_file) and os.path.exists(sha_file):
            with open(sha_file, "r") as f:
                cached_sha = f.read().strip()
            if cached_sha == self.kb_sha256:
                print("[+] Valid cached FAISS index found. Loading vectors into memory...")
                self.faiss_index = faiss.read_index(index_file)
                with open(passages_file, "r", encoding="utf-8") as f:
                    self.passages = json.load(f)
                print(f"[+] Loaded {self.faiss_index.ntotal} vectors from cache.")
                return

        # Build fresh semantic cards and FAISS index
        print("[*] Generating semantic retrieval passage cards for KB transactions...")
        print("[*] Loading SentenceTransformer 'intfloat/multilingual-e5-small' on CPU...")
        self.model = SentenceTransformer("intfloat/multilingual-e5-small")

        card_texts = [p["card_text"] for p in self.passages]
        print(f"[*] Embedding {len(card_texts)} passage cards (384 dimensions)...")
        start_time = time.time()
        # e5-small requires 'passage: ' prefix for documents (which is already formatted)
        embeddings = self.model.encode(
            card_texts,
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        embeddings = np.array(embeddings, dtype=np.float32)
        print(f"[+] Embedding completed in {time.time() - start_time:.2f}s.")

        # Create FAISS IndexFlatL2 (with normalized vectors, L2 is monotonically equivalent to Cosine similarity)
        dim = embeddings.shape[1]
        self.faiss_index = faiss.IndexFlatL2(dim)
        self.faiss_index.add(embeddings)

        # Cache index, passages, and SHA-256 hash
        print(f"[*] Caching FAISS index and passage metadata to {self.cache_dir}...")
        faiss.write_index(self.faiss_index, index_file)
        with open(passages_file, "w", encoding="utf-8") as f:
            json.dump(self.passages, f, ensure_ascii=False)
        with open(sha_file, "w") as f:
            f.write(self.kb_sha256)
        print("[+] Semantic index cached successfully.")

    def _generate_passage_cards(self) -> List[Dict[str, Any]]:
        """
        Formats each transaction into the canonical passage card specified by Section 11/14:
        passage: Transaction <id> | Customer <id> | Channel <channel> | Amount <amount> | Location <loc> | Rules: <rules> | Context: <notes>
        """
        passages = []
        for _, row in self.df.iterrows():
            txn_id = str(row["transaction_id"])
            cust_id = str(row["customer_id"])
            cust_name = str(row["customer_name"])
            segment = str(row["customer_segment"])
            channel = str(row["channel"])
            amt_usd = float(row["amount_usd_equiv"])
            currency = str(row["currency"])
            amt = float(row["amount"])
            city = str(row.get("txn_city", "DRC"))
            province = str(row.get("txn_province", "Kinshasa"))
            rules = str(row.get("alert_reason_codes", ""))
            if not rules or rules == "nan" or pd.isna(row.get("alert_reason_codes")):
                rules = "NONE"
            narration = str(row.get("narration", ""))
            pattern = str(row.get("alert_primary_pattern", "NORMAL"))
            severity = str(row.get("alert_severity", "NONE"))
            case_status = str(row.get("case_status", "NONE"))

            card_text = (
                f"passage: Transaction {txn_id} | Customer {cust_id} ({cust_name}, {segment}) | "
                f"Channel {channel} | Amount ${amt_usd:,.2f} ({currency} {amt:,.2f}) | "
                f"Location {city}, {province} | Rules: {rules} | "
                f"Context: {narration}. Pattern: {pattern}. Severity: {severity}. Case: {case_status}"
            )

            passages.append({
                "transaction_id": txn_id,
                "customer_id": cust_id,
                "customer_name": cust_name,
                "channel": channel,
                "amount_usd_equiv": amt_usd,
                "pattern": pattern,
                "severity": severity,
                "card_text": card_text,
            })
        return passages

    def search_semantic(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic query using intfloat/multilingual-e5-small or TF-IDF cosine similarity fallback.
        """
        if not FAISS_AVAILABLE or self.faiss_index is None:
            if not hasattr(self, 'tfidf_matrix') or self.tfidf_matrix is None:
                return []
            q_vec = self.tfidf_vectorizer.transform([query.strip()])
            sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
            top_indices = np.argsort(sims)[::-1][:top_k]
            results = []
            for idx in top_indices:
                if idx < len(self.passages):
                    item = dict(self.passages[idx])
                    item["similarity_score"] = round(float(sims[idx]), 4)
                    item["l2_distance"] = round(float(1.0 - sims[idx]), 4)
                    results.append(item)
            return results

        if self.model is None:
            self.model = SentenceTransformer("intfloat/multilingual-e5-small")

        formatted_query = f"query: {query.strip()}"
        query_vec = self.model.encode(
            [formatted_query],
            normalize_embeddings=True
        )
        query_vec = np.array(query_vec, dtype=np.float32)

        distances, indices = self.faiss_index.search(query_vec, top_k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.passages):
                item = dict(self.passages[idx])
                # Convert L2 distance of normalized vectors to cosine similarity score [0, 1]
                # Cosine sim = 1 - (L2^2 / 2)
                sim_score = max(0.0, min(1.0, 1.0 - (float(dist) / 2.0)))
                item["similarity_score"] = round(sim_score, 4)
                item["l2_distance"] = round(float(dist), 4)
                results.append(item)
        return results

    @staticmethod
    def _clean_dict(d: dict) -> dict:
        """Removes NaN and converts NumPy types for JSON safety."""
        out = {}
        for k, v in d.items():
            if pd.isna(v):
                out[k] = None
            elif isinstance(v, (np.integer, int)):
                out[k] = int(v)
            elif isinstance(v, (np.floating, float)):
                out[k] = float(v)
            elif isinstance(v, (np.bool_, bool)):
                out[k] = bool(v)
            else:
                out[k] = v
        return out


# Global singleton engine
retrieval_engine = SentientRetrievalEngine()
