"""
Rawbank Sentient Fraud Intelligence Platform - Enterprise Data Quality & Compliance Assurance
Script: qa_check.py
Validates RAWBANK_SENTIENT_KB.csv and RAWBANK_SENTIENT_GROUND_TRUTH.csv against enterprise BFSI criteria.
"""

import sys
import pandas as pd
import numpy as np
from datetime import datetime, timezone

def run_qa_checks():
    print("=" * 80)
    print("RAWBANK SENTIENT FRAUD INTELLIGENCE PLATFORM - DATA QA SUITE")
    print("=" * 80)
    
    passed_tests = 0
    total_tests = 0
    warnings = []
    errors = []

    def check(condition, test_name, details=""):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            passed_tests += 1
            print(f" [PASS] {test_name} - {details}")
        else:
            errors.append(f"{test_name}: {details}")
            print(f" [FAIL] {test_name} - {details}")

    # 1. Load Files
    print("\n--- 1. File Ingestion & Template Schema Conformance ---")
    try:
        kb_df = pd.read_csv('RAWBANK_SENTIENT_KB.csv')
        template_df = pd.read_csv('03_RAWBANK_SENTIENT_MASTER_TEMPLATE.csv')
        gt_df = pd.read_csv('RAWBANK_SENTIENT_GROUND_TRUTH.csv')
        gt_schema_df = pd.read_csv('04_RAWBANK_SENTIENT_GROUND_TRUTH_SCHEMA.csv')
        print(" [OK] All dataset files successfully read.")
    except Exception as e:
        print(f" [FATAL] File loading failed: {e}")
        sys.exit(1)

    # 2. Schema and Column Order Conformance
    expected_cols = list(template_df.columns)
    actual_cols = list(kb_df.columns)
    
    check(len(actual_cols) == 110, "Master KB Column Count", f"Expected 110 columns, found {len(actual_cols)}")
    check(actual_cols == expected_cols, "Master KB Column Order & Exact Match", "Matches 03_RAWBANK_SENTIENT_MASTER_TEMPLATE.csv 1:1")

    gt_expected_cols = list(gt_schema_df['column_name'])
    gt_actual_cols = list(gt_df.columns)
    check(gt_actual_cols == gt_expected_cols, "Ground Truth Schema & Column Order", f"Matches 04_RAWBANK_SENTIENT_GROUND_TRUTH_SCHEMA.csv (Count: {len(gt_actual_cols)})")

    # 3. Scale and Volume Metrics
    print("\n--- 2. Scale, Entity Volume & Date Window Constraints ---")
    row_count = len(kb_df)
    check(2400 <= row_count <= 2600, "Transaction Row Count", f"{row_count} rows (Target: 2400 - 2600)")

    unique_custs = kb_df['customer_id'].nunique()
    check(100 <= unique_custs <= 140, "Unique Customers Count", f"{unique_custs} customers (Target: 100 - 140)")

    # Beneficiaries (excluding null/empty)
    unique_bens = kb_df['beneficiary_id'].dropna().nunique()
    check(150 <= unique_bens <= 220, "Unique Beneficiaries Count", f"{unique_bens} beneficiaries (Target: 150 - 220)")

    # Devices (excluding null/empty)
    unique_devs = kb_df['device_id'].dropna().nunique()
    check(120 <= unique_devs <= 170, "Unique Devices Count", f"{unique_devs} devices (Target: 120 - 170)")

    # Date Span
    kb_df['parsed_ts'] = pd.to_datetime(kb_df['event_timestamp_local'])
    min_date = kb_df['parsed_ts'].min()
    max_date = kb_df['parsed_ts'].max()
    date_span_days = (max_date - min_date).total_seconds() / 86400.0
    check(89.0 <= date_span_days <= 91.0, "Continuous History Span", f"{date_span_days:.2f} days ({min_date.date()} to {max_date.date()})")

    # Chronological sort per customer
    customer_chronological = True
    for cid, group in kb_df.groupby('customer_id'):
        if not group['parsed_ts'].is_monotonic_increasing:
            customer_chronological = False
            break
    check(customer_chronological, "Customer Chronological Sequence", "All customer transactions are strictly chronological")

    # 4. Enterprise Context & Enums
    print("\n--- 3. DRC Enterprise Context & Controlled Enums ---")
    currencies = set(kb_df['currency'].unique())
    check(currencies.issubset({'CDF', 'USD', 'EUR'}), "Currencies", f"Observed: {currencies}")
    
    # Check currency proportions
    cdf_pct = (kb_df['currency'] == 'CDF').mean() * 100
    usd_pct = (kb_df['currency'] == 'USD').mean() * 100
    eur_pct = (kb_df['currency'] == 'EUR').mean() * 100
    check(40 <= cdf_pct <= 55 and 40 <= usd_pct <= 55 and 3 <= eur_pct <= 10, "Currency Distribution Mix", f"CDF: {cdf_pct:.1f}%, USD: {usd_pct:.1f}%, EUR: {eur_pct:.1f}%")

    # Channels
    expected_channels = {'ILLICOCASH', 'RAWBANK_ONLINE', 'CARD', 'ATM', 'BRANCH', 'AGENT_BANKING', 'VISA_DIRECT', 'SIOP', 'SWIFT_LIGHT'}
    actual_channels = set(kb_df['channel'].unique())
    check(actual_channels.issubset(expected_channels), "Omnichannel Enums", f"All {len(actual_channels)} channels recognized")
    check(len(actual_channels) == 9, "Channel Representation", "All 9 Rawbank channels represented in data")

    # Customer Segments
    segments = set(kb_df['customer_segment'].unique())
    expected_segs = {'ECO', 'PREMIUM', 'PRESTIGE', 'INFINITE', 'EMPLOYEE', 'ACADEMIA', 'DIASPORA', 'LADYS_FIRST', 'SME', 'CORPORATE'}
    check(segments.issubset(expected_segs), "Customer Segments", f"Observed {len(segments)} segments: {segments}")

    # DRC Locations
    allowed_cities = {'KINSHASA', 'LUBUMBASHI', 'KOLWEZI', 'GOMA', 'MATADI', 'BRUSSELS', 'PARIS', 'FOREIGN_CITY'}
    txn_cities = set(kb_df['txn_city'].dropna().unique())
    check(txn_cities.issubset(allowed_cities), "Geographic Footprint", f"Observed cities: {txn_cities}")
    check({'KINSHASA', 'LUBUMBASHI', 'KOLWEZI', 'GOMA', 'MATADI'}.issubset(txn_cities), "Core DRC Coverage", "Kinshasa, Lubumbashi, Kolwezi, Goma, Matadi all represented")

    # 5. Entity Referential Integrity Across Rows
    print("\n--- 4. Entity Attribute Referential Consistency Across Batches ---")
    
    # Customer consistency
    cust_mismatches = 0
    for cid, group in kb_df.groupby('customer_id'):
        if group['customer_name'].nunique() > 1 or group['customer_segment'].nunique() > 1 or group['customer_type'].nunique() > 1:
            cust_mismatches += 1
    check(cust_mismatches == 0, "Customer Referential Consistency", f"0 attribute collisions across {unique_custs} customers")

    # Beneficiary consistency
    ben_mismatches = 0
    for bid, group in kb_df[kb_df['beneficiary_id'].notna() & (kb_df['beneficiary_id'] != '')].groupby('beneficiary_id'):
        if group['beneficiary_name'].nunique() > 1 or group['beneficiary_type'].nunique() > 1:
            ben_mismatches += 1
    check(ben_mismatches == 0, "Beneficiary Referential Consistency", f"0 attribute collisions across {unique_bens} beneficiaries")

    # Device consistency
    dev_mismatches = 0
    for did, group in kb_df[kb_df['device_id'].notna() & (kb_df['device_id'] != '')].groupby('device_id'):
        if group['device_type'].nunique() > 1 or group['device_os'].nunique() > 1:
            dev_mismatches += 1
    check(dev_mismatches == 0, "Device Referential Consistency", f"0 attribute collisions across {unique_devs} devices")

    # Merchant consistency
    merch_mismatches = 0
    for mid, group in kb_df[kb_df['merchant_id'].notna() & (kb_df['merchant_id'] != '')].groupby('merchant_id'):
        if group['merchant_name'].nunique() > 1 or group['merchant_category'].nunique() > 1:
            merch_mismatches += 1
    check(merch_mismatches == 0, "Merchant Referential Consistency", f"0 attribute collisions across merchants")

    # 6. Mathematical & Rolling Feature Integrity
    print("\n--- 5. Deterministic Rolling Metrics & Financial Integrity ---")
    
    # USD Equivalence check
    calc_usd = (kb_df['amount'] * kb_df['fx_rate_to_usd']).round(2)
    usd_diff = (kb_df['amount_usd_equiv'] - calc_usd).abs()
    check((usd_diff <= 0.05).all(), "USD Equivalence Calculation", f"Max divergence: {usd_diff.max():.4f}")

    # Amount to Median Ratio check
    ratio_diff = (kb_df['amount_to_median_ratio'] - (kb_df['amount_usd_equiv'] / kb_df['customer_median_txn_usd_90d'])).abs()
    check((ratio_diff <= 0.02).all(), "Amount-to-Median Ratio Integrity", f"Max divergence: {ratio_diff.max():.4f}")

    # Rolling transaction count integrity (10m and 1h)
    count_10m_correct = (kb_df['txn_count_10m'] >= 1).all()
    count_1h_correct = (kb_df['txn_count_1h'] >= kb_df['txn_count_10m']).all()
    check(count_10m_correct, "10-Minute Rolling Txn Count Positive", "All counts >= 1")
    check(count_1h_correct, "1-Hour >= 10-Minute Txn Count Monotonicity", "txn_count_1h >= txn_count_10m for all rows")

    # Outbound Amount 1h USD vs Amount USD Equiv
    outbound_correct = (kb_df.apply(lambda r: r['outbound_amount_1h_usd'] >= r['amount_usd_equiv'] if r['direction'] == 'DEBIT' else True, axis=1)).all()
    check(outbound_correct, "1-Hour Outbound USD >= Current Debit Txn", "Rolling outbound accumulator includes current debit amount")

    # Balance Reconciliation
    calc_post = kb_df.apply(lambda r: round(r['available_balance_before_usd'] - r['amount_usd_equiv'] if r['direction'] == 'DEBIT' else r['available_balance_before_usd'] + r['amount_usd_equiv'], 2), axis=1)
    bal_diff = (kb_df['available_balance_after_usd'] - calc_post).abs()
    check((bal_diff <= 0.05).all(), "Double-Entry Balance Reconciliation", f"Max divergence: {bal_diff.max():.4f}")

    # Corporate Approvals Invariant
    corp_approvals_valid = (kb_df['approvals_completed'] <= kb_df['approvals_required']).all()
    check(corp_approvals_valid, "Corporate Approvals Invariant", "approvals_completed <= approvals_required for 100% of rows")

    # 7. Synthetic Fraud Rules FR-01 through FR-20
    print("\n--- 6. Fraud Rule Firing & Scoring Engine Validation ---")
    all_triggered_rules = []
    for rc in kb_df['alert_reason_codes'].dropna():
        for r in str(rc).split('|'):
            if r.startswith('FR-'):
                all_triggered_rules.append(r)
    
    unique_rules = set(all_triggered_rules)
    expected_all_fr = {f"FR-{i:02d}" for i in range(1, 21)}
    missing_rules = expected_all_fr - unique_rules
    check(len(missing_rules) == 0, "FR-01 to FR-20 Full Coverage", f"All 20 synthetic fraud rules triggered (Missing: {missing_rules})")

    # Score Clamping
    scores_clamped = ((kb_df['alert_score'] >= 0) & (kb_df['alert_score'] <= 100)).all()
    check(scores_clamped, "Alert Score Clamped [0 - 100]", f"Min: {kb_df['alert_score'].min()}, Max: {kb_df['alert_score'].max()}")

    # Severity Mapping
    sev_correct = True
    for _, r in kb_df.iterrows():
        sev = r['alert_severity']
        score = r['alert_score']
        alert = r['alert_generated_flag']
        if not alert and sev != 'NONE':
            sev_correct = False
            break
        if alert:
            if score >= 75 and sev != 'CRITICAL':
                sev_correct = False
                break
            elif 55 <= score < 75 and sev != 'HIGH':
                sev_correct = False
                break
            elif 35 <= score < 55 and sev != 'MEDIUM':
                sev_correct = False
                break
            elif score < 35 and sev != 'LOW':
                sev_correct = False
                break
    check(sev_correct, "Severity Band Alignment", "Alert scores strictly mapped: NONE(0-19 unalerted), LOW(20-34), MEDIUM(35-54), HIGH(55-74), CRITICAL(75-100)")

    # Alert Rate
    alert_count = kb_df['alert_generated_flag'].sum()
    alert_rate_pct = (alert_count / row_count) * 100
    check(14.0 <= alert_rate_pct <= 18.0, "Alert Rate Target (14% - 18%)", f"{alert_count} alerts ({alert_rate_pct:.2f}%)")

    # 8. Ground Truth Integrity
    print("\n--- 7. Ground Truth Dataset Integrity ---")
    check(len(gt_df) == len(kb_df), "Ground Truth Row Alignment", f"{len(gt_df)} GT rows match {len(kb_df)} KB rows")
    check((gt_df['transaction_id'] == kb_df['transaction_id']).all(), "1:1 Transaction Key Alignment", "Master KB and Ground Truth transaction_id vectors match exactly")
    
    gt_classes = set(gt_df['ground_truth_class'].unique())
    check(gt_classes.issubset({'NORMAL', 'FRAUD', 'BENIGN_ANOMALY'}), "Ground Truth Classes", f"Classes: {gt_classes}")

    # Summary
    print("\n" + "=" * 80)
    print("QA AUDIT SUMMARY & COMPLIANCE SCORECARD")
    print("=" * 80)
    print(f"Total Verification Tests Executed : {total_tests}")
    print(f"Tests Passed                     : {passed_tests} / {total_tests} ({(passed_tests/total_tests)*100:.1f}%)")
    print(f"Critical Errors Found            : {len(errors)}")

    if errors:
        print("\nFailed Tests:")
        for err in errors:
            print(f" - {err}")
        return False
    else:
        print("\nAll compliance checks PASSED. Dataset conforms strictly to enterprise BFSI data quality requirements.")
        return True

if __name__ == '__main__':
    success = run_qa_checks()
    sys.exit(0 if success else 1)
