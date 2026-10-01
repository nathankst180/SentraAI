export interface KPIsData {
  total_transactions: number;
  total_volume_usd: number;
  total_volume_cdf: number;
  total_alerts: number;
  alert_rate: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  none_alerts: number;
  total_exposure_usd: number;
  open_cases: number;
  closed_cases: number;
  severity_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    NONE: number;
  };
}

export interface DailyTrendPoint {
  date: string;
  total_txns: number;
  alert_count: number;
  critical_count: number;
  high_count: number;
  total_volume_usd: number;
  exposure_usd: number;
}

export interface ChannelStat {
  channel: string;
  total_txns: number;
  alert_count: number;
  alert_rate: number;
  total_volume_usd: number;
  exposure_usd: number;
  avg_alert_score: number;
}

export interface GeoStat {
  city: string;
  total_txns: number;
  alert_count: number;
  exposure_usd: number;
  avg_alert_score: number;
}

export interface RiskyCustomer {
  customer_id: string;
  customer_name: string;
  customer_segment: string;
  kyc_risk_band: string;
  alert_count: number;
  max_alert_score: number;
  total_exposure_usd: number;
}

export interface SuspiciousBeneficiary {
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_type: string;
  max_senders: number;
  transaction_count: number;
  alert_count: number;
  total_received_usd: number;
}

export interface FlaggedDevice {
  device_id: string;
  device_type: string;
  device_os: string;
  accounts_seen: number;
  alert_count: number;
  max_alert_score: number;
}

export interface AnalyticsData {
  daily_trends: DailyTrendPoint[];
  channel_distribution: ChannelStat[];
  geographic_distribution: GeoStat[];
  top_risky_entities: {
    top_customers: RiskyCustomer[];
    suspicious_beneficiaries: SuspiciousBeneficiary[];
    flagged_devices: FlaggedDevice[];
  };
}

export interface AlertItem {
  transaction_id: string;
  event_timestamp_local: string;
  customer_id: string;
  customer_name: string;
  customer_segment: string;
  channel: string;
  channel_action: string;
  amount: number;
  currency: string;
  amount_usd_equiv: number;
  amount_to_median_ratio: number;
  alert_score: number;
  alert_severity: string;
  alert_primary_pattern: string;
  alert_reason_codes: string;
  potential_exposure_usd: number;
  case_id: string;
  case_status: string;
  analyst_queue: string;
  human_disposition: string;
  touchpoint_id?: string;
  txn_city?: string;
}

export interface AlertsResponse {
  items: AlertItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TriggeredRule {
  id: string;
  title: string;
  category: string;
  weight: number;
  severity: string;
  description: string;
  sop?: string;
  evidence_detail: string;
}

export interface CounterEvidence {
  id: string;
  title: string;
  deduction: number;
  description: string;
  observation: string;
}

export interface TransactionDrilldown {
  transaction: {
    transaction_id: string;
    timestamp: string;
    batch_id: string;
    amount: number;
    currency: string;
    fx_rate_to_usd: number;
    amount_usd_equiv: number;
    amount_to_median_ratio: number;
    channel: string;
    channel_action: string;
    payment_rail: string;
    transaction_type: string;
    direction: string;
    transaction_status: string;
    failure_reason: string;
    is_cross_border: boolean;
    origin_country: string;
    destination_country: string;
    destination_city: string;
    narration: string;
    recurring_flag: boolean;
    corporate_payment_flag: boolean;
  };
  customer: {
    customer_id: string;
    customer_name: string;
    customer_type: string;
    customer_segment: string;
    age_band: string;
    occupation_industry: string;
    resident_status: string;
    home_country: string;
    home_province: string;
    home_city: string;
    relationship_tenure_days: number;
    kyc_risk_band: string;
    pep_flag: boolean;
    monthly_inflow_usd_equiv: number;
    median_usd_90d: number;
    avg_usd_30d: number;
  };
  account: {
    account_id: string;
    account_type: string;
    account_currency: string;
    account_status: string;
    available_balance_before_usd: number;
    available_balance_after_usd: number;
    card_product: string;
    card_status: string;
  };
  counterparty: {
    beneficiary_id: string;
    beneficiary_name: string;
    beneficiary_type: string;
    beneficiary_relationship: string;
    beneficiary_age_days: number | string;
    beneficiary_prior_txn_count: number | string;
    beneficiary_distinct_sender_count_30d: number | string;
    merchant_id: string;
    merchant_name: string;
    merchant_category: string;
  };
  device_and_session: {
    device_id: string;
    device_type: string;
    device_os: string;
    device_first_seen_days: number;
    device_trusted_flag: boolean;
    device_accounts_seen_30d: number;
    touchpoint_id: string;
    touchpoint_type: string;
    card_entry_mode: string;
    txn_province: string;
    txn_city: string;
    ip_country: string;
    ip_city: string;
    ip_risk_score: number;
    vpn_proxy_flag: boolean;
    minutes_since_prev_txn: number | null;
    previous_txn_city: string | null;
  };
  auth_and_security: {
    auth_method: string;
    auth_success_flag: boolean;
    login_failures_30m: number;
    password_reset_hours_ago: number | null;
    sim_swap_days_ago: number | null;
    approvals_required: number;
    approvals_completed: number;
    unusual_time_flag: boolean;
  };
  alert_evaluation: {
    alert_generated: boolean;
    alert_id: string;
    alert_score: number;
    alert_severity: string;
    primary_pattern: string;
    reason_codes: string;
    behavioral_deviation_score: number;
    potential_exposure_usd: number;
    case_id: string;
    case_status: string;
    analyst_queue: string;
    human_disposition: string;
    disposition_reason: string;
    escalation_required: boolean;
    escalation_tier: string;
  };
  triggered_rules: TriggeredRule[];
  counter_evidence: CounterEvidence[];
  copilot_context: {
    case_summary: string;
    copilot_status: string;
    suggested_prompts: string[];
  };
}

export interface CopilotInvestigation {
  observed_facts: string[];
  derived_metrics: string[];
  triggered_rules: {
    rule_code: string;
    rule_name: string;
    weight: number;
    detail: string;
  }[];
  supporting_evidence: string[];
  counter_evidence: string[];
  evidence_gaps: string[];
  recommended_analyst_action: {
    action: string;
    rationale: string;
    disposition_suggestion: 'LEGITIMATE' | 'SUSPICIOUS' | 'INSUFFICIENT_EVIDENCE' | string;
    next_steps: string[];
  };
  executive_summary: string;
}

export interface CopilotChatResponse {
  success: boolean;
  transaction_id: string;
  query: string;
  engine: string;
  context_summary: {
    amount_usd: number;
    channel: string;
    severity: string;
    score: number;
    pattern: string;
    triggered_rules_count: number;
    counter_evidence_count: number;
    semantic_similar_count: number;
  };
  investigation: CopilotInvestigation;
}

export interface CopilotSuggestionsResponse {
  suggestions: string[];
}
