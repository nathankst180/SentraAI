"""
Rawbank Sentient Fraud Intelligence Platform - Fraud Investigation Copilot
File: backend/copilot.py
Implements Use Case 02: Sentient Fraud Investigation Copilot as specified in
SentientData_RuleSet.md (Sections 11, 12, 14).

Features:
- Dual Context Builder (Deterministic Facts + FAISS Semantic Retrieval)
- Groq LLM Orchestration with model `openai/gpt-oss-20b` (and robust fallbacks)
- Strict Section 12 Response Structure:
  1. Observed Facts
  2. Derived Metrics
  3. Triggered Rules
  4. Supporting Evidence
  5. Counter-Evidence
  6. Evidence Gaps
  7. Recommended Analyst Action
- Safety Constraints:
  * Probabilistic language (never 'CONFIRMED_FRAUD')
  * Only cite verified facts
  * Explicitly identify evidence gaps
- Built-in Deterministic Synthesis Engine (guarantees operation if Groq key is absent or offline)
"""

import os
import sys
import re
import json
import traceback
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Load .env if present
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

try:
    import groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from retrieval import retrieval_engine
from rules_meta import RULES_CATALOG, COUNTER_EVIDENCE_CATALOG

GROQ_MODELS = [
    "openai/gpt-oss-120b",     # Most capable available model
    "openai/gpt-oss-20b",      # Faster / fallback
    "qwen/qwen3.8-27b",        # Additional fallback
]


class SentientCopilot:
    def __init__(self):
        self.api_key = ""
        self.groq_client = None
        self._get_groq_client()

    def _get_groq_client(self):
        """Dynamically re-checks environment variables and .env files on each query."""
        root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
        backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
        
        if os.path.exists(root_env):
            load_dotenv(root_env, override=True)
        if os.path.exists(backend_env):
            load_dotenv(backend_env, override=True)

        current_key = os.environ.get("GROQ_API_KEY", "").strip()
        if current_key and GROQ_AVAILABLE:
            if not self.groq_client or self.api_key != current_key:
                try:
                    self.api_key = current_key
                    self.groq_client = groq.Groq(api_key=current_key)
                    masked = f"{current_key[:6]}...{current_key[-4:]}" if len(current_key) > 10 else "***"
                    print(f"[+] Groq Client dynamically initialized with key: {masked}")
                except Exception as e:
                    print(f"[!] Warning: Failed to re-initialize Groq client: {e}")
                    self.groq_client = None
        elif not current_key:
            self.groq_client = None
            self.api_key = ""

        return self.groq_client

    def build_context(self, transaction_id: str, query: str = "") -> Dict[str, Any]:
        """Combines deterministic customer/device facts + semantic FAISS search results."""
        txn = retrieval_engine.get_transaction(transaction_id)
        if not txn:
            return {"error": f"Transaction '{transaction_id}' not found in canonical KB."}

        cust_id = txn.get("customer_id")
        dev_id = txn.get("device_id")
        ben_id = txn.get("beneficiary_id")

        # 1. Deterministic facts
        customer_baseline = retrieval_engine.get_customer_baseline(cust_id) if cust_id else {}
        device_graph = retrieval_engine.get_device_graph(dev_id) if dev_id else {}
        beneficiary_network = retrieval_engine.get_beneficiary_network(ben_id) if ben_id else {}

        # 2. Triggered rules & counter-evidence
        triggered_rules = []
        raw_reason_codes = str(txn.get("alert_reason_codes", "") or "")
        if raw_reason_codes and raw_reason_codes != "nan":
            for code in raw_reason_codes.split("|"):
                code = code.strip()
                if code in RULES_CATALOG:
                    triggered_rules.append(RULES_CATALOG[code])

        counter_evidence = []
        is_trusted = bool(txn.get("device_trusted_flag", False))
        prior_bens = int(txn.get("beneficiary_prior_txn_count", 0) or 0)
        if is_trusted and prior_bens >= 3:
            ce = dict(COUNTER_EVIDENCE_CATALOG[0])
            ce["observation"] = f"Trusted device with {prior_bens} prior completed transfers to beneficiary."
            counter_evidence.append(ce)

        if str(txn.get("recurring_or_scheduled_flag", "")).upper() == "TRUE":
            ce = dict(COUNTER_EVIDENCE_CATALOG[1])
            ce["observation"] = "Standing scheduled/recurring mandate registered in core banking."
            counter_evidence.append(ce)

        if txn.get("customer_segment") == "DIASPORA" and str(txn.get("is_cross_border", "")).upper() == "TRUE":
            ce = dict(COUNTER_EVIDENCE_CATALOG[2])
            ce["observation"] = "Diaspora customer segment; cross-border flow matches expected profile."
            counter_evidence.append(ce)

        if txn.get("customer_type") == "CORPORATE" and txn.get("beneficiary_relationship") == "SUPPLIER":
            req = txn.get("approvals_required", 0)
            comp = txn.get("approvals_completed", 0)
            if req and comp == req:
                ce = dict(COUNTER_EVIDENCE_CATALOG[3])
                ce["observation"] = f"Verified corporate supplier payment with maker-checker signatures ({comp}/{req})."
                counter_evidence.append(ce)

        ratio = float(txn.get("amount_to_median_ratio", 1.0) or 1.0)
        if txn.get("customer_segment") in ["PREMIUM", "PRESTIGE", "INFINITE", "CORPORATE"] and ratio <= 1.5:
            ce = dict(COUNTER_EVIDENCE_CATALOG[4])
            ce["observation"] = f"Transaction amount ratio {ratio:.2f}x is normal for affluent/corporate tier."
            counter_evidence.append(ce)

        # 3. Semantic Retrieval (Nearest historical incident cards from FAISS)
        semantic_query = query if query and len(query.strip()) > 3 else f"{txn.get('alert_primary_pattern')} {txn.get('channel')} {txn.get('txn_city')}"
        semantic_matches = retrieval_engine.search_semantic(semantic_query, top_k=3)

        return {
            "transaction": txn,
            "customer_baseline": customer_baseline,
            "device_graph": device_graph,
            "beneficiary_network": beneficiary_network,
            "triggered_rules": triggered_rules,
            "counter_evidence": counter_evidence,
            "semantic_similar_cases": semantic_matches,
        }

    def investigate(self, transaction_id: str, query: str = "") -> Dict[str, Any]:
        """
        Executes an investigation turn:
        Builds unified context, invokes Groq (or fallback engine), and guarantees Section 12 structured output.
        """
        context = self.build_context(transaction_id, query)
        if "error" in context:
            return {
                "success": False,
                "error": context["error"],
                "transaction_id": transaction_id
            }

        # Check if Groq is available
        client = self._get_groq_client()
        llm_response = None
        used_model = "deterministic-rule-synthesizer"

        # Always compute deterministic baseline for robust fallback and schema normalization
        deterministic_fallback = self._synthesize_deterministic_investigation(context, query)

        if client:
            llm_response, used_model = self._call_groq(context, query)

        # If LLM response succeeded, normalize against Section 12 schema contract; else use deterministic synthesis
        if llm_response:
            final_investigation = self._normalize_investigation(llm_response, deterministic_fallback)
        else:
            final_investigation = deterministic_fallback
            used_model = "deterministic-rule-synthesizer (BFSI Sections 11, 12, 14)"

        return {
            "success": True,
            "transaction_id": transaction_id,
            "query": query,
            "engine": used_model,
            "investigation": final_investigation,
            "context_summary": {
                "amount_usd": context["transaction"].get("amount_usd_equiv"),
                "channel": context["transaction"].get("channel"),
                "severity": context["transaction"].get("alert_severity"),
                "score": context["transaction"].get("alert_score"),
                "pattern": context["transaction"].get("alert_primary_pattern"),
                "triggered_rules_count": len(context["triggered_rules"]),
                "counter_evidence_count": len(context["counter_evidence"]),
                "semantic_similar_count": len(context["semantic_similar_cases"]),
            }
        }

    def _call_groq(self, context: Dict[str, Any], query: str) -> tuple[Optional[Dict[str, Any]], str]:
        """Calls Groq with strict Section 12 prompt schema."""
        txn = context["transaction"]
        cust = context["customer_baseline"]
        dev = context["device_graph"]
        ben = context["beneficiary_network"]

        system_prompt = """You are the Rawbank DRC SentraAI Fraud Investigation Copilot, an enterprise BFSI AI intelligence layer.
You assist frontline fraud analysts by interrogating transaction telemetry, behavioral baselines, device link graphs, and mule networks.

CRITICAL OPERATIONAL & SAFETY CONSTRAINTS:
1. You are NOT the database. Cite ONLY the verified facts and metrics provided in the prompt. Never invent accounts, amounts, or timestamps.
2. You must NEVER output 'CONFIRMED_FRAUD'. Fraud classification is reserved strictly for certified human analysts. Use probabilistic language such as 'The available evidence is consistent with possible account takeover' or 'Risk signals suggest high probability of mule account activity'.
3. When evidence is incomplete or unobserved, you MUST explicitly state it in 'Evidence Gaps'.
4. Adhere strictly to the required 7-part response format.

RESPONSE FORMAT (JSON):
You must output a valid JSON object with the following exact keys:
{
  "observed_facts": ["fact 1", "fact 2", ...],
  "derived_metrics": ["metric 1 with exact numbers", ...],
  "triggered_rules": [
    {"rule_code": "FR-XX", "rule_name": "...", "weight": 12, "detail": "..."}
  ],
  "supporting_evidence": ["Suspicious indicator 1", ...],
  "counter_evidence": ["Mitigating factor 1 (CE-XX)", ...],
  "evidence_gaps": ["Unverified element 1", ...],
  "recommended_analyst_action": {
    "action": "TEMPORARY_HOLD / STEP_UP_AUTH / CONTACT_CUSTOMER / ESCALATE_AML / CLOSE_LEGITIMATE",
    "rationale": "...",
    "disposition_suggestion": "SUSPICIOUS / LEGITIMATE / INSUFFICIENT_EVIDENCE",
    "next_steps": ["step 1", "step 2"]
  },
  "executive_summary": "Direct natural-language synthesis addressing the analyst's specific inquiry. If the analyst asks a specific question (e.g. ATO likelihood, device risk, false-positive justification, SAR drafting), answer it directly while referencing telemetry. If the query is off-topic (e.g. general coding, trivia, non-banking questions), politely state that you are the dedicated Rawbank Fraud Investigation Copilot and provide the case risk summary."
}"""

        user_content = f"""INVESTIGATION REQUEST:
Query: {query if query else 'Provide comprehensive fraud triage and forensic risk assessment.'}

VERIFIED TELEMETRY (Ground Truth Facts):
- Transaction ID: {txn.get('transaction_id')}
- Timestamp: {txn.get('event_timestamp_local')}
- Amount: ${txn.get('amount_usd_equiv', 0):,.2f} USD ({txn.get('currency')} {txn.get('amount', 0):,.2f})
- Channel: {txn.get('channel')} ({txn.get('channel_action')}) via {txn.get('payment_rail')}
- Location: {txn.get('txn_city')}, {txn.get('txn_province')} (Country: {txn.get('origin_country')})
- Destination: {txn.get('destination_city')}, {txn.get('destination_country')}
- Narration: "{txn.get('narration')}"
- Alert Severity: {txn.get('alert_severity')} (Score: {txn.get('alert_score')}/100)
- Primary Suspected Pattern: {txn.get('alert_primary_pattern')}
- Case Status / Queue: {txn.get('case_status')} / {txn.get('analyst_queue')}

CUSTOMER BASELINE & 90-DAY PROFILE:
- Customer: {cust.get('customer_name')} ({cust.get('customer_id')})
- Segment / Package: {cust.get('customer_segment')} / {txn.get('product_package')}
- Tenure: {txn.get('relationship_tenure_days')} days | KYC Risk Band: {cust.get('kyc_risk_band')} | PEP: {cust.get('pep_flag')}
- 90-Day Median Amount: ${cust.get('median_usd_90d', 0):,.2f} USD | 30-Day Average: ${cust.get('avg_usd_90d', 0):,.2f} USD
- Ratio to Median: {txn.get('amount_to_median_ratio', 1.0):.2f}x
- Historical Transaction Count: {cust.get('total_transactions', 0)} (Past Alerts: {cust.get('total_alerts', 0)})

DEVICE & AUTH TELEMETRY:
- Device ID: {dev.get('device_id')} ({dev.get('device_type')}, OS: {dev.get('device_os')})
- Device Trusted: {dev.get('trusted_flag')} | First Seen: {dev.get('first_seen_days')} days ago
- Accounts Seen on Device (30d): {dev.get('accounts_seen_30d', 1)} (Is Shared Device Anomaly: {dev.get('is_shared_device_anomaly')})
- Auth Method: {txn.get('auth_method')} (Success: {txn.get('auth_success_flag')})
- Login Failures (30m): {txn.get('login_failures_30m')} | Password Reset Hours Ago: {txn.get('password_reset_hours_ago')}
- SIM Swap Days Ago: {txn.get('sim_swap_days_ago')} | VPN/Proxy: {txn.get('vpn_proxy_flag')}
- Impossible Travel Flag: {txn.get('impossible_travel_flag')} (Distance: {txn.get('geo_distance_from_home_km')} km)

COUNTERPARTY / BENEFICIARY NETWORK:
- Beneficiary: {ben.get('beneficiary_name')} ({ben.get('beneficiary_id')})
- Type / Relationship: {ben.get('beneficiary_type')} / {ben.get('beneficiary_relationship')}
- Distinct Senders (30d): {ben.get('distinct_sender_count_30d', 0)} (Is Mule Suspect: {ben.get('is_mule_fanin_suspect')})
- Total Amount Received: ${ben.get('total_received_usd', 0):,.2f} USD
- Prior Completed Transactions with this Customer: {txn.get('beneficiary_prior_txn_count', 0)}

TRIGGERED DETERMINISTIC RULES:
{json.dumps(context['triggered_rules'], indent=2)}

IDENTIFIED COUNTER-EVIDENCE:
{json.dumps(context['counter_evidence'], indent=2)}

SEMANTICALLY SIMILAR HISTORICAL CASES (FAISS E5-Small):
{json.dumps([m['card_text'] for m in context['semantic_similar_cases']], indent=2)}
"""

        for model_name in GROQ_MODELS:
            try:
                response = self.groq_client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=2048,
                    timeout=60,
                )
                raw_text = response.choices[0].message.content
                if not raw_text or not raw_text.strip():
                    print(f"[!] Groq model '{model_name}' returned empty response, trying next model.")
                    continue
                parsed = json.loads(raw_text)
                print(f"[+] Groq model '{model_name}' responded successfully.")
                return parsed, f"Groq ({model_name})"
            except json.JSONDecodeError as e:
                print(f"[!] Groq model '{model_name}' returned invalid JSON: {e}")
                continue
            except Exception as e:
                err_str = str(e)
                print(f"[!] Groq model '{model_name}' attempt failed: {err_str[:200]}")
                continue

        print("[!] All Groq models exhausted. Using deterministic synthesis engine.")
        return None, "fallback"

    def _normalize_investigation(self, parsed: Any, fallback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates, sanitizes, and normalizes Groq's response to guarantee 100% adherence
        to the Section 12 7-part schema. If any field or array is omitted or ill-typed,
        it merges seamlessly with the deterministic baseline.
        """
        if not isinstance(parsed, dict):
            return fallback

        def ensure_list(val, default_list):
            if isinstance(val, list):
                out = []
                for item in val:
                    if isinstance(item, str) and item.strip():
                        out.append(item.strip())
                    elif isinstance(item, dict):
                        desc = item.get("description") or item.get("observation") or item.get("detail") or item.get("text")
                        out.append(str(desc) if desc else json.dumps(item))
                    elif item is not None and str(item).strip():
                        out.append(str(item).strip())
                return out if out else default_list
            if isinstance(val, str) and val.strip():
                return [val.strip()]
            return default_list

        def ensure_rules(val, default_rules):
            if isinstance(val, list):
                out = []
                for item in val:
                    if isinstance(item, dict):
                        out.append({
                            "rule_code": str(item.get("rule_code") or item.get("id") or item.get("code") or "FR-XX"),
                            "rule_name": str(item.get("rule_name") or item.get("title") or item.get("name") or "Fraud Rule"),
                            "weight": int(item.get("weight", 10) or 10),
                            "detail": str(item.get("detail") or item.get("description") or item.get("reason") or "")
                        })
                    elif isinstance(item, str) and item.strip():
                        out.append({
                            "rule_code": "FR-XX",
                            "rule_name": item.strip(),
                            "weight": 10,
                            "detail": item.strip()
                        })
                return out if out else default_rules
            return default_rules

        # Section 1: Observed Facts
        observed = ensure_list(
            parsed.get("observed_facts") or parsed.get("facts") or parsed.get("observed_telemetry"),
            fallback.get("observed_facts", [])
        )

        # Section 2: Derived Metrics
        derived = ensure_list(
            parsed.get("derived_metrics") or parsed.get("metrics") or parsed.get("behavioral_metrics"),
            fallback.get("derived_metrics", [])
        )

        # Section 3: Triggered Rules
        rules = ensure_rules(
            parsed.get("triggered_rules") or parsed.get("rules") or parsed.get("rule_evaluations"),
            fallback.get("triggered_rules", [])
        )

        # Section 4: Supporting Evidence (Check aliases: risk_signals, supporting_evidence, evidence)
        supporting = ensure_list(
            parsed.get("supporting_evidence") or parsed.get("risk_signals") or parsed.get("evidence"),
            fallback.get("supporting_evidence", ["Elevated risk indicators observed in telemetry."])
        )

        # Section 5: Counter-Evidence (Check aliases: counter_evidence, mitigating_factors, mitigating_evidence)
        counter = ensure_list(
            parsed.get("counter_evidence") or parsed.get("mitigating_factors") or parsed.get("mitigating_evidence"),
            fallback.get("counter_evidence", ["No mitigating factors identified."])
        )

        # Section 6: Evidence Gaps (Check aliases: evidence_gaps, gaps, unverified_items)
        gaps = ensure_list(
            parsed.get("evidence_gaps") or parsed.get("gaps") or parsed.get("unverified_elements"),
            fallback.get("evidence_gaps", ["Out-of-band verification required."])
        )

        # Section 7: Recommended Analyst Action
        rec_raw = parsed.get("recommended_analyst_action") or parsed.get("recommended_action") or {}
        fb_rec = fallback.get("recommended_analyst_action", {})
        if isinstance(rec_raw, dict):
            rec_action = {
                "action": str(rec_raw.get("action") or fb_rec.get("action", "MONITOR_AND_REVIEW")),
                "rationale": str(rec_raw.get("rationale") or fb_rec.get("rationale", "Standard operational review.")),
                "disposition_suggestion": str(rec_raw.get("disposition_suggestion") or fb_rec.get("disposition_suggestion", "SUSPICIOUS")),
                "next_steps": ensure_list(rec_raw.get("next_steps") or rec_raw.get("steps"), fb_rec.get("next_steps", ["Review telemetry"]))
            }
        else:
            rec_action = fb_rec

        # Executive Summary
        summary = str(parsed.get("executive_summary") or parsed.get("summary") or fallback.get("executive_summary", ""))

        return {
            "observed_facts": observed,
            "derived_metrics": derived,
            "triggered_rules": rules,
            "supporting_evidence": supporting,
            "counter_evidence": counter,
            "evidence_gaps": gaps,
            "recommended_analyst_action": rec_action,
            "executive_summary": summary,
        }


    def _synthesize_deterministic_investigation(self, context: Dict[str, Any], query: str) -> Dict[str, Any]:
        """
        Deterministic, rule-based reasoning engine implementing the exact 7-part Section 12 structure.
        Guarantees instant, zero-failure copilot responses matching enterprise BFSI standards.
        """
        txn = context["transaction"]
        cust = context["customer_baseline"]
        dev = context["device_graph"]
        ben = context["beneficiary_network"]
        rules = context["triggered_rules"]
        counter_ev = context["counter_evidence"]

        # 1. Observed Facts
        observed_facts = [
            f"Transaction ID {txn.get('transaction_id')} executed at {txn.get('event_timestamp_local')} via channel {txn.get('channel')} ({txn.get('channel_action')}).",
            f"Transaction value: ${txn.get('amount_usd_equiv', 0):,.2f} USD ({txn.get('currency')} {txn.get('amount', 0):,.2f}) under package {txn.get('product_package')}.",
            f"Customer {cust.get('customer_name')} ({cust.get('customer_id')}), segment {cust.get('customer_segment')}, tenure {txn.get('relationship_tenure_days')} days, KYC risk band {cust.get('kyc_risk_band')}.",
            f"Device ID {dev.get('device_id')} ({dev.get('device_type')}, OS: {dev.get('device_os')}) with trusted_flag={dev.get('trusted_flag')} and first_seen_days={dev.get('first_seen_days')}.",
            f"Geolocation: {txn.get('txn_city')}, {txn.get('txn_province')} with reported IP risk score {txn.get('ip_risk_score', 0)}/100 (VPN/Proxy={txn.get('vpn_proxy_flag')}).",
            f"Beneficiary: {ben.get('beneficiary_name')} ({ben.get('beneficiary_id')}), type: {ben.get('beneficiary_type')}, relationship: {ben.get('beneficiary_relationship')}."
        ]

        # 2. Derived Metrics
        ratio = float(txn.get("amount_to_median_ratio", 1.0) or 1.0)
        median_usd = float(cust.get("median_usd_90d", 0.0) or 0.0)
        distinct_senders = int(ben.get("distinct_sender_count_30d", 0) or 0)
        dev_accounts = int(dev.get("accounts_seen_30d", 1) or 1)
        velocity_10m = int(txn.get("txn_count_10m", 1) or 1)
        outbound_1h = float(txn.get("outbound_amount_1h_usd", 0.0) or 0.0)

        derived_metrics = [
            f"Amount-to-median ratio: {ratio:.2f}x against 90-day baseline median of ${median_usd:,.2f} USD.",
            f"Sliding velocity: {velocity_10m} transactions in 10 minutes; 1-hour cumulative outbound is ${outbound_1h:,.2f} USD.",
            f"Counterparty fan-in velocity: Beneficiary has received funds from {distinct_senders} distinct customer accounts in 30 days.",
            f"Device dispersion index: Hardware ID associated with {dev_accounts} distinct banking accounts in the last 30 days.",
            f"Behavioral deviation score: {txn.get('behavioral_deviation_score', 0)}/100 calibrated against customer profile."
        ]

        # 3. Triggered Rules
        triggered_rules_out = []
        for r in rules:
            code = r.get("id", r.get("rule_code", "FR-XX"))
            title = r.get("title", r.get("rule_name", "Synthetic Rule"))
            triggered_rules_out.append({
                "rule_code": code,
                "rule_name": title,
                "weight": r.get("weight", 10),
                "detail": r.get("description", "")
            })

        # 4. Supporting Evidence
        supporting_evidence = []
        if ratio >= 5.0:
            supporting_evidence.append(f"Significant amount outlier: Transaction is {ratio:.1f}x higher than customer's established median.")
        if str(txn.get("impossible_travel_flag", "")).upper() == "TRUE":
            supporting_evidence.append(f"Impossible travel violation: Distance of {txn.get('geo_distance_from_home_km')} km recorded {txn.get('minutes_since_prev_txn')} mins after previous transaction.")
        if int(txn.get("login_failures_30m", 0) or 0) >= 3:
            supporting_evidence.append(f"Brute force signal: {txn.get('login_failures_30m')} failed login attempts within 30 minutes of transaction.")
        if dev_accounts >= 3:
            supporting_evidence.append(f"Mule/Syndicate hardware: Device shared across {dev_accounts} distinct customer accounts.")
        if distinct_senders >= 5:
            supporting_evidence.append(f"Mule fan-in anomaly: Counterparty receiving rapid fund dispersals from {distinct_senders} senders.")
        if str(txn.get("vpn_proxy_flag", "")).upper() == "TRUE":
            supporting_evidence.append("Anonymized network connection: Transaction initiated through active VPN/commercial proxy.")
        if not supporting_evidence:
            supporting_evidence.append(f"Triggered rule reason codes: {txn.get('alert_reason_codes', 'None')}")

        # 5. Counter-Evidence
        counter_evidence_out = []
        for ce in counter_ev:
            ce_id = ce.get("id", "CE-XX")
            ce_title = ce.get("title", "")
            ce_obs = ce.get("observation", ce.get("description", ""))
            counter_evidence_out.append(f"{ce_id} ({ce_title}): {ce_obs}")
        if not counter_evidence_out:
            counter_evidence_out.append("No mitigating factors or exonerating counter-evidence identified in available telemetry.")

        # 6. Evidence Gaps
        evidence_gaps = [
            "Customer out-of-band telecom verification: Callback to registered mobile number has not yet been logged.",
            "Device IMEI / MAC address telemetry: Hardware fingerprint limited to browser/app OS profile.",
            "Destination account settlement state: Core clearing confirmation at beneficiary receiving institution pending.",
            "Historical commercial contract: For corporate/supplier transactions, invoice documentation has not been uploaded to document vault."
        ]

        # 7. Recommended Analyst Action
        severity = str(txn.get("alert_severity", "MEDIUM"))
        score = int(txn.get("alert_score", 50) or 50)

        if severity == "CRITICAL" or score >= 75:
            action_code = "TEMPORARY_HOLD_AND_STEP_UP"
            disposition = "SUSPICIOUS"
            rationale = "Multiple high-weight risk indicators (ratio, device anomaly, or impossible travel) detected with insufficient counter-evidence."
            next_steps = [
                "Place immediate temporary debit freeze on transaction in core banking.",
                "Initiate high-priority out-of-band phone verification with account holder.",
                "Inspect device link graph for associated customer accounts to prevent cascade takeover.",
                "If unverified within 60 minutes, escalate to Tier 2 AML/Fraud unit for SAR drafting."
            ]
        elif severity == "HIGH":
            action_code = "STEP_UP_AUTHENTICATION"
            disposition = "SUSPICIOUS"
            rationale = "Elevated risk profile consistent with unauthorized access or rapid fund movement. Counter-evidence does not fully mitigate risk."
            next_steps = [
                "Require biometric re-authentication or hardware token challenge.",
                "Place counterparty on provisional 24-hour observation list.",
                "Request analyst manual disposition review in Digital Fraud queue."
            ]
        else:
            action_code = "MONITOR_AND_REVIEW"
            disposition = "LEGITIMATE" if len(counter_ev) > 0 else "INSUFFICIENT_EVIDENCE"
            rationale = "Low to medium behavioral variance. Identified counter-evidence suggests possible benign false positive."
            next_steps = [
                "Verify recurring billing schedule or corporate supplier relationship.",
                "Clear alert if customer confirms authenticity through self-service alert channel.",
                "Update customer behavioral baseline if pattern represents new legitimate activity."
            ]

        # Executive Summary using strict probabilistic language
        summary = (
            f"The available evidence for transaction {txn.get('transaction_id')} (${txn.get('amount_usd_equiv', 0):,.2f} USD) "
            f"is consistent with possible {txn.get('alert_primary_pattern', 'anomaly')} (Severity: {severity}, Score: {score}/100). "
            f"Primary risk drivers include {', '.join([r['rule_name'] for r in triggered_rules_out[:2]]) if triggered_rules_out else 'behavioral deviation'}. "
            f"Recommended operational posture: {action_code}."
        )

        return {
            "observed_facts": observed_facts,
            "derived_metrics": derived_metrics,
            "triggered_rules": triggered_rules_out,
            "supporting_evidence": supporting_evidence,
            "counter_evidence": counter_evidence_out,
            "evidence_gaps": evidence_gaps,
            "recommended_analyst_action": {
                "action": action_code,
                "rationale": rationale,
                "disposition_suggestion": disposition,
                "next_steps": next_steps,
            },
            "executive_summary": summary,
        }

    def get_suggestions(self, transaction_id: str) -> List[str]:
        """Provides context-aware 1-click prompt chips for analysts."""
        txn = retrieval_engine.get_transaction(transaction_id)
        if not txn:
            return [
                "Analyze ATO risk factors",
                "Evaluate counter-evidence",
                "Inspect device link graph",
                "Draft SAR executive narrative"
            ]

        pattern = str(txn.get("alert_primary_pattern", "")).upper()
        channel = str(txn.get("channel", "")).upper()
        severity = str(txn.get("alert_severity", "MEDIUM"))

        suggestions = [
            f"Assess probability of {pattern} under {severity} severity threshold",
            "Evaluate counter-evidence and potential false-positive justification",
            f"Inspect device graph and multi-account connections for {txn.get('device_id', 'device')}",
            f"Analyze beneficiary mule risk and 30-day fan-in velocity for {txn.get('beneficiary_name', 'counterparty')}",
            f"Verify channel authorization integrity for {channel}",
            "Draft Suspicious Activity Report (SAR) narrative with factual evidence"
        ]
        return suggestions[:4]


# Global singleton copilot
copilot = SentientCopilot()
