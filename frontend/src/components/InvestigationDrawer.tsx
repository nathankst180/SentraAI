'use client';

import React, { useState } from 'react';
import { TransactionDrilldown } from '@/types';
import {
  X,
  User,
  Laptop,
  MinusCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Building2,
  CreditCard,
  Lock,
  Globe,
  Landmark,
  Scale
} from 'lucide-react';

import { CopilotPanel } from '@/components/CopilotPanel';

interface InvestigationDrawerProps {
  transaction: TransactionDrilldown | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'profile' | 'telemetry' | 'copilot'>('rules');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      {/* Drawer Container */}
      <div className="w-full max-w-4xl bg-[#F4F7FB] border-l border-[#CBD5E1] h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 text-slate-900">
        {/* Drawer Official Bank Header */}
        <div className="p-5 border-b border-[#CBD5E1] bg-[#E8EEF5] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-base font-bold text-slate-900">
                  {transaction?.transaction.transaction_id || 'Inspection Dossier'}
                </span>
                {transaction?.alert_evaluation && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      transaction.alert_evaluation.alert_severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : transaction.alert_evaluation.alert_severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    SEVERITY: {transaction.alert_evaluation.alert_severity}
                  </span>
                )}
                {transaction?.alert_evaluation.alert_score !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 border border-blue-200 text-xs font-mono font-bold">
                    Score: {transaction.alert_evaluation.alert_score}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                <span>Case Ref: <strong className="text-slate-800 font-mono">{transaction?.alert_evaluation.case_id || 'CAS-RB-2026-SURV'}</strong></span>
                <span>&bull;</span>
                <span>{transaction?.transaction.channel}</span>
                <span>&bull;</span>
                <span>{transaction?.transaction.channel_action}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1] hover:bg-[#DDE5EE] text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#CBD5E1] bg-[#E8EEF5]/70 px-6 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'border-blue-700 text-blue-800 font-bold bg-[#F4F7FB]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            Rules &amp; Counter-Evidence ({transaction?.triggered_rules.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-700 text-blue-800 font-bold bg-[#F4F7FB]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Customer 360&deg; &amp; Core Ledger
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-blue-700 text-blue-800 font-bold bg-[#F4F7FB]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Device &amp; Security Telemetry
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'copilot'
                ? 'border-emerald-600 text-emerald-800 font-bold bg-[#F4F7FB]'
                : 'border-transparent text-slate-600 hover:text-emerald-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            SentraAI WhatsApp Copilot
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#E8EEF5]/40">
          {isLoading || !transaction ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-xl bg-[#E2E8F0] border border-[#CBD5E1]" />
              <div className="h-44 rounded-xl bg-[#E2E8F0] border border-[#CBD5E1]" />
              <div className="h-44 rounded-xl bg-[#E2E8F0] border border-[#CBD5E1]" />
            </div>
          ) : activeTab === 'rules' ? (
            /* TAB 1: RULES & COUNTER EVIDENCE */
            <div className="space-y-5">
              {/* Scoring Summary Box */}
              <div className="simple-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Net Clamped Score Calculation
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {transaction.alert_evaluation.alert_score}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ 100</span>
                    <span className="text-xs text-amber-800 font-bold ml-2">
                      Pattern: {transaction.alert_evaluation.primary_pattern}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-red-100/70 border border-red-200 text-center min-w-[100px]">
                    <span className="text-red-700 block text-[10px] font-semibold">Triggered Rules</span>
                    <strong className="text-red-800 text-sm font-mono font-bold">+{transaction.triggered_rules.reduce((acc, r) => acc + r.weight, 0)} pts</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-200 text-center min-w-[100px]">
                    <span className="text-emerald-700 block text-[10px] font-semibold">Counter-Evidence</span>
                    <strong className="text-emerald-800 text-sm font-mono font-bold">-{transaction.counter_evidence.reduce((acc, c) => acc + c.deduction, 0)} pts</strong>
                  </div>
                </div>
              </div>

              {/* Triggered Fraud Rules List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-red-600" />
                  Triggered Synthetic Fraud Rules ({transaction.triggered_rules?.length || 0})
                </h4>
                {(transaction.triggered_rules?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-[#F4F7FB] border border-[#CBD5E1]">
                    No explicit fraud rules triggered for this baseline event.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(transaction.triggered_rules || []).map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 rounded-xl bg-[#F4F7FB] border border-[#CBD5E1] hover:border-red-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                              {rule.id}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{rule.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#E2E8F0] text-slate-700 border border-[#CBD5E1]">
                              {rule.category}
                            </span>
                          </div>
                          <span className="font-bold text-red-700 text-xs font-mono">+{rule.weight} pts</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-2.5 font-medium bg-[#E8EEF5] p-3 rounded-lg border border-[#CBD5E1] leading-relaxed">
                          {rule.evidence_detail}
                        </p>
                        {rule.sop && (
                          <div className="text-[11px] text-amber-900 mt-2.5 flex items-start gap-1.5 bg-amber-100/60 p-2.5 rounded border border-amber-200">
                            <span className="font-bold shrink-0">Analyst SOP Protocol:</span>
                            <span>{rule.sop}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Counter-Evidence List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-emerald-600" />
                  Identified Counter-Evidence Factors ({transaction.counter_evidence?.length || 0})
                </h4>
                {(transaction.counter_evidence?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-[#F4F7FB] border border-[#CBD5E1]">
                    No mitigating factors or counter-evidence observed to deduct points.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(transaction.counter_evidence || []).map((ce) => (
                      <div
                        key={ce.id}
                        className="p-4 rounded-xl bg-[#F4F7FB] border border-emerald-300 hover:border-emerald-400 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {ce.id}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{ce.title}</span>
                          </div>
                          <span className="font-bold text-emerald-700 text-xs font-mono">-{ce.deduction} pts</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-2.5 bg-[#E8EEF5] p-3 rounded-lg border border-emerald-200 leading-relaxed">
                          {ce.observation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            /* TAB 2: CUSTOMER & BASELINE 360 */
            <div className="space-y-5">
              {/* Customer Profile Grid */}
              <div className="simple-card p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-700" /> Account Holder KYC Dossier
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Customer Full Name</span>
                    <strong className="text-slate-900 block mt-0.5 text-xs font-bold">{transaction.customer.customer_name}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Customer CIF Code</span>
                    <strong className="font-mono text-blue-700 block mt-0.5">{transaction.customer.customer_id}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Customer Segment</span>
                    <strong className="text-amber-800 block mt-0.5">{transaction.customer.customer_segment} ({transaction.customer.customer_type})</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">KYC Risk Band</span>
                    <strong className="text-slate-900 block mt-0.5">{transaction.customer.kyc_risk_band}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Relationship Tenure</span>
                    <strong className="text-slate-900 block mt-0.5 font-mono">{transaction.customer.relationship_tenure_days} days</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">PEP Status (Politically Exposed)</span>
                    <strong className={transaction.customer.pep_flag ? 'text-red-700 font-bold' : 'text-emerald-700 font-semibold'}>
                      {transaction.customer.pep_flag ? 'TRUE (Enhanced Due Diligence)' : 'FALSE'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Historical Median & Spending Comparison */}
              <div className="simple-card p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" /> 90-Day Spending Baseline vs Current Transaction
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Transaction Amount</span>
                    <strong className="text-slate-900 text-sm block mt-0.5 font-bold font-mono">
                      ${transaction.transaction.amount_usd_equiv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Customer 90d Median</span>
                    <strong className="text-slate-800 text-sm block mt-0.5 font-mono font-semibold">
                      ${transaction.customer.median_usd_90d?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Amount / Median Ratio</span>
                    <strong className={`text-sm block mt-0.5 font-mono ${transaction.transaction.amount_to_median_ratio >= 5.0 ? 'text-red-700 font-black' : 'text-emerald-700 font-bold'}`}>
                      {transaction.transaction.amount_to_median_ratio}x
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Monthly Inflow</span>
                    <strong className="text-slate-800 text-sm block mt-0.5 font-mono font-semibold">
                      ${transaction.customer.monthly_inflow_usd_equiv?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Ledger Balance Flow */}
                <div className="p-3.5 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1] flex items-center justify-between text-xs flex-wrap gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pre-Txn Available Balance</span>
                    <strong className="text-slate-900 font-mono font-bold">${transaction.account.available_balance_before_usd?.toLocaleString()}</strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500 block text-[10px]">Debit / Credit Movement</span>
                    <strong className={`font-mono font-bold ${transaction.transaction.direction === 'DEBIT' ? 'text-red-700' : 'text-emerald-700'}`}>
                      {transaction.transaction.direction} ${transaction.transaction.amount_usd_equiv.toLocaleString()}
                    </strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500 block text-[10px]">Post-Txn Available Balance</span>
                    <strong className="text-slate-900 font-mono font-bold">${transaction.account.available_balance_after_usd?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Beneficiary Details */}
              {transaction.counterparty.beneficiary_id && (
                <div className="simple-card p-5 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-700" /> Counterparty / Beneficiary Dossier
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Beneficiary Name</span>
                      <strong className="text-slate-900 block mt-0.5 font-bold">{transaction.counterparty.beneficiary_name}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Beneficiary ID</span>
                      <strong className="font-mono text-purple-800 block mt-0.5 font-semibold">{transaction.counterparty.beneficiary_id}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Type / Relationship</span>
                      <strong className="text-slate-800 block mt-0.5">{transaction.counterparty.beneficiary_type} &bull; {transaction.counterparty.beneficiary_relationship}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Prior Transaction History</span>
                      <strong className="text-slate-900 block mt-0.5 font-mono">{transaction.counterparty.beneficiary_prior_txn_count} prior txns</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Distinct Senders (30d)</span>
                      <strong className={`font-mono font-bold ${Number(transaction.counterparty.beneficiary_distinct_sender_count_30d) >= 5 ? 'text-red-700' : 'text-slate-800'}`}>
                        {transaction.counterparty.beneficiary_distinct_sender_count_30d} accounts
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                      <span className="text-slate-500 block text-[10px]">Beneficiary Registration Age</span>
                      <strong className="text-slate-800 block mt-0.5 font-mono">{transaction.counterparty.beneficiary_age_days} days</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'telemetry' ? (
            /* TAB 3: DEVICE & SESSION TELEMETRY */
            <div className="space-y-5">
              {/* Hardware Fingerprint */}
              <div className="simple-card p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-700" /> Hardware Fingerprint &amp; Banking Touchpoint
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Terminal / Device ID</span>
                    <strong className="font-mono text-blue-700 block mt-0.5">{transaction.device_and_session.device_id || 'TERMINAL_CBS'}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Hardware Type &amp; OS</span>
                    <strong className="text-slate-900 block mt-0.5">{transaction.device_and_session.device_type} &bull; {transaction.device_and_session.device_os}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Multi-Account Usage (30d)</span>
                    <strong className={`font-mono font-bold ${transaction.device_and_session.device_accounts_seen_30d >= 3 ? 'text-red-700' : 'text-slate-800'}`}>
                      {transaction.device_and_session.device_accounts_seen_30d} Accounts
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Device Binding Age</span>
                    <strong className="text-slate-900 block mt-0.5 font-mono">{transaction.device_and_session.device_first_seen_days} days</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Touchpoint Access Point</span>
                    <strong className="text-slate-900 block mt-0.5">{transaction.device_and_session.touchpoint_type} ({transaction.device_and_session.touchpoint_id})</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Card Entry Mode</span>
                    <strong className="text-slate-800 block mt-0.5">{transaction.device_and_session.card_entry_mode}</strong>
                  </div>
                </div>
              </div>

              {/* IP & Geolocation Security Signals */}
              <div className="simple-card p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-rose-700" /> IP Geolocation &amp; Impossible Travel
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">IP Location</span>
                    <strong className="text-slate-900 block mt-0.5">{transaction.device_and_session.ip_city}, {transaction.device_and_session.ip_country}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">IP Risk Score</span>
                    <strong className={`font-mono font-bold ${transaction.device_and_session.ip_risk_score > 60 ? 'text-red-700' : 'text-slate-800'}`}>
                      {transaction.device_and_session.ip_risk_score}/100
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Proxy / VPN Detection</span>
                    <strong className={transaction.device_and_session.vpn_proxy_flag ? 'text-red-700 font-bold' : 'text-emerald-700 font-semibold'}>
                      {transaction.device_and_session.vpn_proxy_flag ? 'DETECTED (Flagged)' : 'CLEAR'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Previous City</span>
                    <strong className="text-slate-800 block mt-0.5 font-mono">
                      {transaction.device_and_session.previous_txn_city || 'N/A'} ({transaction.device_and_session.minutes_since_prev_txn ? `${transaction.device_and_session.minutes_since_prev_txn}m` : 'First Txn'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Authentication & Security Telemetry */}
              <div className="simple-card p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-800" /> Authentication &amp; Credential Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Auth Method</span>
                    <strong className="text-slate-900 block mt-0.5">{transaction.auth_and_security.auth_method}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Login Failures (30m)</span>
                    <strong className={`font-mono font-bold ${transaction.auth_and_security.login_failures_30m >= 3 ? 'text-red-700' : 'text-slate-800'}`}>
                      {transaction.auth_and_security.login_failures_30m} Attempts
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">Password Reset</span>
                    <strong className={transaction.auth_and_security.password_reset_hours_ago !== null ? 'text-amber-800 font-bold font-mono' : 'text-slate-500'}>
                      {transaction.auth_and_security.password_reset_hours_ago !== null ? `${transaction.auth_and_security.password_reset_hours_ago}h ago` : 'None'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#E8EEF5] border border-[#CBD5E1]">
                    <span className="text-slate-500 block text-[10px]">SIM Swap</span>
                    <strong className={transaction.auth_and_security.sim_swap_days_ago !== null ? 'text-red-700 font-bold font-mono' : 'text-slate-500'}>
                      {transaction.auth_and_security.sim_swap_days_ago !== null ? `${transaction.auth_and_security.sim_swap_days_ago}d ago` : 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 4: SENTRAAI COPILOT (USE CASE 02) */
            <CopilotPanel transaction={transaction} />
          )}
        </div>

        {/* Drawer Official Action Footer */}
        <div className="p-4 border-t border-[#CBD5E1] bg-[#E8EEF5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Case: <strong className="text-slate-900 font-mono">{transaction?.alert_evaluation.case_id || 'CAS-RB-SURV'}</strong> &bull; Queue: <strong className="text-blue-800 font-semibold">{transaction?.alert_evaluation.analyst_queue}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#F4F7FB] border border-[#CBD5E1] hover:bg-[#E2E8F0] text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert(`Protective measure registered for transaction ${transaction?.transaction.transaction_id}. Post No Debit (PND) placed and escalated to Fraud Control Committee.`);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Post No Debit (PND) &amp; Escalate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
