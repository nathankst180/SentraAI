"""
Rawbank Sentient Fraud Intelligence Platform - DuckDB Analytics Engine
File: backend/database.py
Provides thread-safe, SQL-accelerated analytical queries over RAWBANK_SENTIENT_KB.csv
with clean JSON serialization (no NaN, Inf, or unhandled NumPy types).
"""

import os
import math
import threading
import duckdb
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from rules_meta import RULES_CATALOG, COUNTER_EVIDENCE_CATALOG

CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "RAWBANK_SENTIENT_KB.csv"))


def sanitize_for_json(val: Any) -> Any:
    """Recursively converts NaN, Infinity, NumPy types, and Timestamps to JSON-compliant primitives."""
    if val is None:
        return None
    if isinstance(val, (float, np.floating)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    if isinstance(val, (int, np.integer)):
        return int(val)
    if isinstance(val, (bool, np.bool_)):
        return bool(val)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    if isinstance(val, dict):
        return {k: sanitize_for_json(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [sanitize_for_json(v) for v in val]
    return val


class Database:
    def __init__(self, csv_path: str = CSV_PATH):
        self.csv_path = csv_path
        self.lock = threading.Lock()
        self.con = duckdb.connect(':memory:')
        self._load_table()

    def _execute_df(self, sql: str) -> pd.DataFrame:
        """Executes a query thread-safely using a dedicated cursor and returns a DataFrame."""
        with self.lock:
            return self.con.cursor().execute(sql).df()

    def _execute_scalar(self, sql: str) -> Any:
        """Executes a query thread-safely and returns the first column of the first row."""
        with self.lock:
            row = self.con.cursor().execute(sql).fetchone()
            return row[0] if row is not None else None

    def _load_table(self):
        clean_path = self.csv_path.replace("\\", "/")
        print(f"[*] Ingesting Master Knowledge Base from: {clean_path}")
        with self.lock:
            self.con.cursor().execute(f"CREATE TABLE kb AS SELECT * FROM read_csv_auto('{clean_path}')")
            row_count = self.con.cursor().execute("SELECT count(*) FROM kb").fetchone()[0]
        print(f"[+] Successfully loaded {row_count} canonical transaction rows into in-memory DuckDB.")

    def get_kpis(self) -> Dict[str, Any]:
        """Calculates executive command center KPIs dynamically from the data."""
        sql = """
        SELECT 
            count(*) as total_transactions,
            round(sum(amount_usd_equiv), 2) as total_volume_usd,
            round(sum(CASE WHEN currency = 'CDF' THEN amount ELSE 0 END), 2) as total_volume_cdf,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as total_alerts,
            round(count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) * 100.0 / count(*), 2) as alert_rate,
            count(CASE WHEN alert_severity = 'CRITICAL' THEN 1 END) as critical_alerts,
            count(CASE WHEN alert_severity = 'HIGH' THEN 1 END) as high_alerts,
            count(CASE WHEN alert_severity = 'MEDIUM' THEN 1 END) as medium_alerts,
            count(CASE WHEN alert_severity = 'LOW' THEN 1 END) as low_alerts,
            count(CASE WHEN alert_severity = 'NONE' THEN 1 END) as none_alerts,
            round(sum(potential_exposure_usd), 2) as total_exposure_usd,
            count(CASE WHEN case_status IN ('NEW', 'IN_REVIEW', 'ESCALATED') THEN 1 END) as open_cases,
            count(CASE WHEN case_status = 'CLOSED' THEN 1 END) as closed_cases
        FROM kb
        """
        df = self._execute_df(sql)
        res = df.to_dict(orient='records')[0]
        
        # Add severity breakdown dict
        res['severity_breakdown'] = {
            'CRITICAL': res.get('critical_alerts', 0),
            'HIGH': res.get('high_alerts', 0),
            'MEDIUM': res.get('medium_alerts', 0),
            'LOW': res.get('low_alerts', 0),
            'NONE': res.get('none_alerts', 0)
        }
        return sanitize_for_json(res)

    def get_analytics(self) -> Dict[str, Any]:
        """Produces time-series, channel risk breakdown, geography heatmap, and top risky entities."""
        
        # 1. Daily trend
        daily_sql = """
        SELECT 
            strftime(event_timestamp_local, '%Y-%m-%d') as date,
            count(*) as total_txns,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            count(CASE WHEN alert_severity = 'CRITICAL' THEN 1 END) as critical_count,
            count(CASE WHEN alert_severity = 'HIGH' THEN 1 END) as high_count,
            round(sum(amount_usd_equiv), 2) as total_volume_usd,
            round(sum(potential_exposure_usd), 2) as exposure_usd
        FROM kb
        GROUP BY 1
        ORDER BY 1 ASC
        """
        daily_trends = self._execute_df(daily_sql).to_dict(orient='records')

        # 2. Channel distribution
        channel_sql = """
        SELECT 
            channel,
            count(*) as total_txns,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            round(count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) * 100.0 / count(*), 2) as alert_rate,
            round(sum(amount_usd_equiv), 2) as total_volume_usd,
            round(sum(potential_exposure_usd), 2) as exposure_usd,
            round(avg(COALESCE(alert_score, 0)), 1) as avg_alert_score
        FROM kb
        GROUP BY channel
        ORDER BY alert_count DESC
        """
        channel_dist = self._execute_df(channel_sql).to_dict(orient='records')

        # 3. Geographic distribution
        geo_sql = """
        SELECT 
            COALESCE(txn_city, 'UNKNOWN') as city,
            count(*) as total_txns,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            round(sum(potential_exposure_usd), 2) as exposure_usd,
            round(avg(COALESCE(alert_score, 0)), 1) as avg_alert_score
        FROM kb
        GROUP BY 1
        ORDER BY alert_count DESC
        """
        geo_dist = self._execute_df(geo_sql).to_dict(orient='records')

        # 4. Top Risky Customers
        cust_sql = """
        SELECT 
            customer_id,
            customer_name,
            customer_segment,
            kyc_risk_band,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            max(COALESCE(alert_score, 0)) as max_alert_score,
            round(sum(potential_exposure_usd), 2) as total_exposure_usd
        FROM kb
        WHERE alert_generated_flag = TRUE
        GROUP BY 1, 2, 3, 4
        ORDER BY alert_count DESC, max_alert_score DESC
        LIMIT 5
        """
        top_customers = self._execute_df(cust_sql).to_dict(orient='records')

        # 5. Suspicious Beneficiaries (Mule / repeated alert counterparties)
        ben_sql = """
        SELECT 
            beneficiary_id,
            beneficiary_name,
            beneficiary_type,
            max(COALESCE(beneficiary_distinct_sender_count_30d, 0)) as max_senders,
            count(*) as transaction_count,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            round(sum(amount_usd_equiv), 2) as total_received_usd
        FROM kb
        WHERE beneficiary_id IS NOT NULL AND beneficiary_id != '' AND beneficiary_id != 'NONE'
        GROUP BY 1, 2, 3
        HAVING alert_count >= 2 OR max_senders >= 3
        ORDER BY alert_count DESC, max_senders DESC
        LIMIT 5
        """
        suspicious_bens = self._execute_df(ben_sql).to_dict(orient='records')

        # 6. Flagged Devices (Shared devices across accounts or multiple alerts)
        dev_sql = """
        SELECT 
            device_id,
            device_type,
            device_os,
            max(COALESCE(device_accounts_seen_30d, 0)) as accounts_seen,
            count(CASE WHEN alert_generated_flag = TRUE THEN 1 END) as alert_count,
            max(COALESCE(alert_score, 0)) as max_alert_score
        FROM kb
        WHERE device_id IS NOT NULL AND device_id != '' AND device_id != 'NONE'
        GROUP BY 1, 2, 3
        HAVING accounts_seen >= 3 OR alert_count >= 2
        ORDER BY accounts_seen DESC, alert_count DESC
        LIMIT 5
        """
        flagged_devices = self._execute_df(dev_sql).to_dict(orient='records')

        return sanitize_for_json({
            'daily_trends': daily_trends,
            'channel_distribution': channel_dist,
            'geographic_distribution': geo_dist,
            'top_risky_entities': {
                'top_customers': top_customers,
                'suspicious_beneficiaries': suspicious_bens,
                'flagged_devices': flagged_devices,
            }
        })

    def get_alerts(
        self,
        page: int = 1,
        page_size: int = 15,
        severity: Optional[str] = None,
        channel: Optional[str] = None,
        queue: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Returns paginated, filtered alerts."""
        where_clauses = ["alert_generated_flag = TRUE"]

        if severity and severity.upper() != 'ALL':
            where_clauses.append(f"alert_severity = '{severity.upper()}'")
        if channel and channel.upper() != 'ALL':
            where_clauses.append(f"channel = '{channel.upper()}'")
        if queue and queue.upper() != 'ALL':
            where_clauses.append(f"analyst_queue = '{queue.upper()}'")
        if status and status.upper() != 'ALL':
            where_clauses.append(f"case_status = '{status.upper()}'")
        if search and search.strip():
            term = search.strip().replace("'", "''")
            where_clauses.append(f"""(
                lower(transaction_id) LIKE lower('%{term}%') OR
                lower(customer_id) LIKE lower('%{term}%') OR
                lower(customer_name) LIKE lower('%{term}%') OR
                lower(beneficiary_name) LIKE lower('%{term}%') OR
                lower(narration) LIKE lower('%{term}%') OR
                lower(alert_primary_pattern) LIKE lower('%{term}%')
            )""")

        where_sql = " AND ".join(where_clauses)
        
        # Total count
        total_sql = f"SELECT count(*) FROM kb WHERE {where_sql}"
        total = self._execute_scalar(total_sql) or 0

        offset = (page - 1) * page_size
        query_sql = f"""
        SELECT 
            transaction_id,
            event_timestamp_local,
            customer_id,
            customer_name,
            customer_segment,
            channel,
            channel_action,
            amount,
            currency,
            amount_usd_equiv,
            amount_to_median_ratio,
            alert_score,
            alert_severity,
            alert_primary_pattern,
            alert_reason_codes,
            potential_exposure_usd,
            case_id,
            case_status,
            analyst_queue,
            human_disposition,
            touchpoint_id,
            txn_city
        FROM kb 
        WHERE {where_sql}
        ORDER BY 
            CASE alert_severity 
                WHEN 'CRITICAL' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'MEDIUM' THEN 3 
                WHEN 'LOW' THEN 4 
                ELSE 5 
            END ASC,
            COALESCE(alert_score, 0) DESC,
            event_timestamp_local DESC
        LIMIT {page_size} OFFSET {offset}
        """
        records = self._execute_df(query_sql).to_dict(orient='records')
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return sanitize_for_json({
            'items': records,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        })

    def get_transaction_drilldown(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Provides full 360-degree forensic inspection for a single transaction."""
        txn_clean = transaction_id.strip().replace("'", "''")
        sql = f"SELECT * FROM kb WHERE transaction_id = '{txn_clean}' LIMIT 1"
        df = self._execute_df(sql)
        if df.empty:
            return None

        row = df.to_dict(orient='records')[0]

        # 1. Parse triggered rules
        triggered_rules = []
        raw_reason_codes = str(row.get('alert_reason_codes', '') or '')
        if raw_reason_codes:
            for code in raw_reason_codes.split('|'):
                code = code.strip()
                if code in RULES_CATALOG:
                    rule_info = dict(RULES_CATALOG[code])
                    # Add dynamic context
                    if code in ['FR-01', 'FR-02']:
                        ratio_val = row.get('amount_to_median_ratio')
                        ratio_str = f"{float(ratio_val):.1f}x" if ratio_val is not None and not pd.isna(ratio_val) else "N/A"
                        med_val = row.get('customer_median_txn_usd_90d')
                        med_str = f"${float(med_val):,.2f}" if med_val is not None and not pd.isna(med_val) else "N/A"
                        rule_info['evidence_detail'] = f"Amount ${row['amount_usd_equiv']:,.2f} is {ratio_str} customer median ({med_str})"
                    elif code == 'FR-04':
                        rule_info['evidence_detail'] = f"Device {row.get('device_id')} (OS: {row.get('device_os')}) first seen {row.get('device_first_seen_days')} days ago"
                    elif code == 'FR-05':
                        rule_info['evidence_detail'] = f"{row.get('login_failures_30m')} failed login attempts recorded in 30 min"
                    elif code == 'FR-06':
                        rule_info['evidence_detail'] = f"Password reset {row.get('password_reset_hours_ago')} hours before transaction"
                    elif code == 'FR-07':
                        rule_info['evidence_detail'] = f"SIM swap detected {row.get('sim_swap_days_ago')} days ago"
                    elif code == 'FR-08':
                        rule_info['evidence_detail'] = f"{row.get('txn_count_10m')} transactions within 10-minute sliding window"
                    elif code == 'FR-09':
                        out_val = row.get('outbound_amount_1h_usd')
                        out_str = f"${float(out_val):,.2f}" if out_val is not None and not pd.isna(out_val) else "N/A"
                        rule_info['evidence_detail'] = f"1-hour cumulative outbound is {out_str}"
                    elif code == 'FR-10':
                        rule_info['evidence_detail'] = f"Previous location was {row.get('previous_txn_city')} ({row.get('minutes_since_prev_txn')} mins ago), current: {row.get('txn_city')}"
                    elif code == 'FR-13':
                        rule_info['evidence_detail'] = f"Device accessed {row.get('device_accounts_seen_30d')} distinct customer accounts in 30 days"
                    elif code == 'FR-14':
                        rule_info['evidence_detail'] = f"Beneficiary received funds from {row.get('beneficiary_distinct_sender_count_30d')} distinct customers in 30 days"
                    elif code == 'FR-20':
                        rule_info['evidence_detail'] = f"Corporate payment has {row.get('approvals_completed')} approvals completed of {row.get('approvals_required')} required"
                    else:
                        rule_info['evidence_detail'] = rule_info['description']
                    triggered_rules.append(rule_info)

        # 2. Check counter-evidence identified
        counter_evidence = []
        is_trusted_dev = str(row.get('device_trusted_flag', '')).upper() == 'TRUE'
        prior_bens = row.get('beneficiary_prior_txn_count')
        try:
            prior_bens_cnt = int(prior_bens) if prior_bens not in [None, '', 'NONE'] and not pd.isna(prior_bens) else 0
        except Exception:
            prior_bens_cnt = 0
            
        if is_trusted_dev and prior_bens_cnt >= 3:
            ce = dict(COUNTER_EVIDENCE_CATALOG[0])
            ce['observation'] = f"Primary trusted device with {prior_bens_cnt} prior completed transactions to beneficiary"
            counter_evidence.append(ce)

        if str(row.get('recurring_or_scheduled_flag', '')).upper() == 'TRUE':
            ce = dict(COUNTER_EVIDENCE_CATALOG[1])
            ce['observation'] = "Scheduled / recurring mandate flagged in core system"
            counter_evidence.append(ce)

        if row.get('customer_segment') == 'DIASPORA' and str(row.get('is_cross_border', '')).upper() == 'TRUE':
            ce = dict(COUNTER_EVIDENCE_CATALOG[2])
            ce['observation'] = "Customer is registered in Diaspora segment; international origin matches residence"
            counter_evidence.append(ce)

        if row.get('customer_type') == 'CORPORATE' and row.get('beneficiary_relationship') == 'SUPPLIER':
            appr_req = row.get('approvals_required')
            appr_comp = row.get('approvals_completed')
            if appr_comp == appr_req and appr_req not in [None, 0, '0'] and not pd.isna(appr_req):
                ce = dict(COUNTER_EVIDENCE_CATALOG[3])
                ce['observation'] = "Approved corporate supplier payment with maker-checker signatures verified"
                counter_evidence.append(ce)

        ratio_raw = row.get('amount_to_median_ratio')
        try:
            ratio = float(ratio_raw) if ratio_raw is not None and not pd.isna(ratio_raw) else 1.0
        except Exception:
            ratio = 1.0

        if row.get('customer_segment') in ['PREMIUM', 'PRESTIGE', 'INFINITE', 'CORPORATE'] and ratio <= 1.5:
            ce = dict(COUNTER_EVIDENCE_CATALOG[4])
            ce['observation'] = f"Transaction ratio {ratio:.2f}x is well within affluent/corporate normal range"
            counter_evidence.append(ce)

        # 3. Assemble response payload
        payload = {
            'transaction': {
                'transaction_id': row.get('transaction_id'),
                'timestamp': row.get('event_timestamp_local'),
                'batch_id': row.get('batch_id'),
                'amount': row.get('amount'),
                'currency': row.get('currency'),
                'fx_rate_to_usd': row.get('fx_rate_to_usd'),
                'amount_usd_equiv': row.get('amount_usd_equiv'),
                'amount_to_median_ratio': row.get('amount_to_median_ratio'),
                'channel': row.get('channel'),
                'channel_action': row.get('channel_action'),
                'payment_rail': row.get('payment_rail'),
                'transaction_type': row.get('transaction_type'),
                'direction': row.get('direction'),
                'transaction_status': row.get('transaction_status'),
                'failure_reason': row.get('failure_reason'),
                'is_cross_border': str(row.get('is_cross_border', '')).upper() == 'TRUE',
                'origin_country': row.get('origin_country'),
                'destination_country': row.get('destination_country'),
                'destination_city': row.get('destination_city'),
                'narration': row.get('narration'),
                'recurring_flag': str(row.get('recurring_or_scheduled_flag', '')).upper() == 'TRUE',
                'corporate_payment_flag': str(row.get('corporate_payment_flag', '')).upper() == 'TRUE',
            },
            'customer': {
                'customer_id': row.get('customer_id'),
                'customer_name': row.get('customer_name'),
                'customer_type': row.get('customer_type'),
                'customer_segment': row.get('customer_segment'),
                'age_band': row.get('age_band'),
                'occupation_industry': row.get('occupation_industry'),
                'resident_status': row.get('resident_status'),
                'home_country': row.get('home_country'),
                'home_province': row.get('home_province'),
                'home_city': row.get('home_city'),
                'relationship_tenure_days': row.get('relationship_tenure_days'),
                'kyc_risk_band': row.get('kyc_risk_band'),
                'pep_flag': str(row.get('pep_flag', '')).upper() == 'TRUE',
                'monthly_inflow_usd_equiv': row.get('monthly_inflow_usd_equiv'),
                'median_usd_90d': row.get('customer_median_txn_usd_90d'),
                'avg_usd_30d': row.get('customer_avg_txn_usd_30d'),
            },
            'account': {
                'account_id': row.get('account_id'),
                'account_type': row.get('account_type'),
                'account_currency': row.get('account_currency'),
                'account_status': row.get('account_status'),
                'available_balance_before_usd': row.get('available_balance_before_usd'),
                'available_balance_after_usd': row.get('available_balance_after_usd'),
                'card_product': row.get('card_product'),
                'card_status': row.get('card_status'),
            },
            'counterparty': {
                'beneficiary_id': row.get('beneficiary_id'),
                'beneficiary_name': row.get('beneficiary_name'),
                'beneficiary_type': row.get('beneficiary_type'),
                'beneficiary_relationship': row.get('beneficiary_relationship'),
                'beneficiary_age_days': row.get('beneficiary_age_days'),
                'beneficiary_prior_txn_count': row.get('beneficiary_prior_txn_count'),
                'beneficiary_distinct_sender_count_30d': row.get('beneficiary_distinct_sender_count_30d'),
                'merchant_id': row.get('merchant_id'),
                'merchant_name': row.get('merchant_name'),
                'merchant_category': row.get('merchant_category'),
            },
            'device_and_session': {
                'device_id': row.get('device_id'),
                'device_type': row.get('device_type'),
                'device_os': row.get('device_os'),
                'device_first_seen_days': row.get('device_first_seen_days'),
                'device_trusted_flag': is_trusted_dev,
                'device_accounts_seen_30d': row.get('device_accounts_seen_30d'),
                'touchpoint_id': row.get('touchpoint_id'),
                'touchpoint_type': row.get('touchpoint_type'),
                'card_entry_mode': row.get('card_entry_mode'),
                'txn_province': row.get('txn_province'),
                'txn_city': row.get('txn_city'),
                'ip_country': row.get('ip_country'),
                'ip_city': row.get('ip_city'),
                'ip_risk_score': row.get('ip_risk_score'),
                'vpn_proxy_flag': str(row.get('vpn_proxy_flag', '')).upper() == 'TRUE',
                'minutes_since_prev_txn': row.get('minutes_since_prev_txn'),
                'previous_txn_city': row.get('previous_txn_city'),
            },
            'auth_and_security': {
                'auth_method': row.get('auth_method'),
                'auth_success_flag': str(row.get('auth_success_flag', '')).upper() == 'TRUE',
                'login_failures_30m': row.get('login_failures_30m'),
                'password_reset_hours_ago': row.get('password_reset_hours_ago'),
                'sim_swap_days_ago': row.get('sim_swap_days_ago'),
                'approvals_required': row.get('approvals_required'),
                'approvals_completed': row.get('approvals_completed'),
                'unusual_time_flag': str(row.get('unusual_time_flag', '')).upper() == 'TRUE',
            },
            'alert_evaluation': {
                'alert_generated': str(row.get('alert_generated_flag', '')).upper() == 'TRUE',
                'alert_id': row.get('alert_id'),
                'alert_score': int(row.get('alert_score') or 0) if row.get('alert_score') not in [None, ''] and not pd.isna(row.get('alert_score')) else 0,
                'alert_severity': row.get('alert_severity', 'NONE'),
                'primary_pattern': row.get('alert_primary_pattern', 'NONE'),
                'reason_codes': row.get('alert_reason_codes', ''),
                'behavioral_deviation_score': row.get('behavioral_deviation_score'),
                'potential_exposure_usd': row.get('potential_exposure_usd', 0.0),
                'case_id': row.get('case_id'),
                'case_status': row.get('case_status', 'NONE'),
                'analyst_queue': row.get('analyst_queue', 'NONE'),
                'human_disposition': row.get('human_disposition', 'UNREVIEWED'),
                'disposition_reason': row.get('disposition_reason', ''),
                'escalation_required': str(row.get('escalation_required_flag', '')).upper() == 'TRUE',
                'escalation_tier': row.get('escalation_tier', 'NONE'),
            },
            'triggered_rules': triggered_rules,
            'counter_evidence': counter_evidence,
            'copilot_context': {
                'case_summary': f"Transaction {row.get('transaction_id')} by {row.get('customer_name')} ({row.get('customer_id')}) via {row.get('channel')} flagged as {row.get('alert_severity')} severity with score {row.get('alert_score')}/100 for suspected {row.get('alert_primary_pattern')}.",
                'copilot_status': 'READY_FOR_AGENT_COPILOT',
                'suggested_prompts': [
                    f"Explain why alert {row.get('alert_id', row.get('transaction_id'))} was assigned {row.get('alert_severity')} severity.",
                    f"Analyze counter-evidence for customer {row.get('customer_id')} and evaluate if this is a benign false positive.",
                    f"Review the beneficiary network for {row.get('beneficiary_name')} ({row.get('beneficiary_id')}) to check for mule syndicates.",
                    "Draft an Analyst SAR narrative with evidence breakdown."
                ]
            }
        }
        return sanitize_for_json(payload)

# Global database singleton
db = Database()
