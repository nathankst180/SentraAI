'use client';

import React, { useState } from 'react';
import { TransactionDrilldown } from '@/types';
import {
  X,
  ShieldAlert,
  User,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  CreditCard,
  Lock,
  Globe,
  Radio,
  FileText,
  BadgeAlert,
  Flame,
  Scale,
  Landmark,
  FileCheck,
  ShieldCheck,
  HelpCircle
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end transition-opacity">
      {/* Drawer Container */}
      <div className="w-full max-w-4xl bg-[#060D17] border-l border-[#1E3E66] h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Drawer Official Bank Header */}
        <div className="p-5 border-b border-[#1E3E66] bg-[#0A192C] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F3C64F] via-[#D4AF37] to-[#8C7323] p-[2px] shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#060D17] rounded-[10px] flex items-center justify-center">
                <Landmark className="w-6 h-6 text-[#F3C64F]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-base font-black text-white">
                  {transaction?.transaction.transaction_id || 'Dossier d\'Inspection'}
                </span>
                {transaction?.alert_evaluation && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                      transaction.alert_evaluation.alert_severity === 'CRITICAL'
                        ? 'bg-red-950/80 text-red-300 border-red-500/50'
                        : transaction.alert_evaluation.alert_severity === 'HIGH'
                        ? 'bg-orange-950/80 text-orange-300 border-orange-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    GRAVITÉ: {transaction.alert_evaluation.alert_severity}
                  </span>
                )}
                {transaction?.alert_evaluation.alert_score !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-[#142E52] text-[#F3C64F] border border-[#D4AF37]/40 text-xs font-mono font-bold">
                    Score: {transaction.alert_evaluation.alert_score}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Ref Dossier: <strong className="text-slate-200 font-mono">{transaction?.alert_evaluation.case_id || 'CAS-RB-2026-SURV'}</strong></span>
                <span>&bull;</span>
                <span>{transaction?.transaction.channel}</span>
                <span>&bull;</span>
                <span>{transaction?.transaction.channel_action}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#0E223D] border border-[#1E3E66] hover:border-slate-400 text-slate-400 hover:text-white transition-colors"
            title="Fermer le dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#1E3E66] bg-[#060D17] px-6 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Règles &amp; Contre-Preuves ({transaction?.triggered_rules.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Dossier Client 360&deg; &amp; Grand Livre
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'border-[#D4AF37] text-[#F3C64F]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Télémétrie Dispositif &amp; Sécurité
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'copilot'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-purple-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Copilot IA SentraAI (Cas d'Usage 02)
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !transaction ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66]" />
              <div className="h-44 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66]" />
              <div className="h-44 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66]" />
            </div>
          ) : activeTab === 'rules' ? (
            /* TAB 1: RULES & COUNTER EVIDENCE */
            <div className="space-y-5">
              {/* Scoring Summary Box */}
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Calcul Mathématique du Score Net Clamped
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white font-mono">
                      {transaction.alert_evaluation.alert_score}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                    <span className="text-xs text-[#F3C64F] font-bold ml-2">
                      Typologie: {transaction.alert_evaluation.primary_pattern}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-center min-w-[100px]">
                    <span className="text-slate-400 block text-[10px]">Poids Règles Fired</span>
                    <strong className="text-red-400 text-sm font-mono">+{transaction.triggered_rules.reduce((acc, r) => acc + r.weight, 0)} pts</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center min-w-[100px]">
                    <span className="text-slate-400 block text-[10px]">Contre-Preuves</span>
                    <strong className="text-emerald-400 text-sm font-mono">-{transaction.counter_evidence.reduce((acc, c) => acc + c.deduction, 0)} pts</strong>
                  </div>
                </div>
              </div>

              {/* Triggered Fraud Rules List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-red-400" />
                  Règles de Fraude Synthétiques Déclenchées ({transaction.triggered_rules?.length || 0})
                </h4>
                {(transaction.triggered_rules?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded bg-[#0A192C]">
                    Aucune règle de fraude explicite déclenchée pour cet événement de référence.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(transaction.triggered_rules || []).map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 rounded-xl bg-[#0A192C] border border-[#1E3E66] hover:border-red-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/40">
                              {rule.id}
                            </span>
                            <span className="font-bold text-xs text-white">{rule.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#142E52] text-slate-300 border border-[#1E3E66]">
                              {rule.category}
                            </span>
                          </div>
                          <span className="font-black text-red-400 text-xs font-mono">+{rule.weight} pts</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2.5 font-medium bg-[#060D17] p-3 rounded-lg border border-[#1E3E66]/60 leading-relaxed">
                          {rule.evidence_detail}
                        </p>
                        {rule.sop && (
                          <div className="text-[11px] text-[#F3C64F] mt-2.5 flex items-start gap-1.5 bg-[#D4AF37]/10 p-2.5 rounded border border-[#D4AF37]/20">
                            <span className="font-bold shrink-0">Procédure Opératoire SOP:</span>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-emerald-400" />
                  Facteurs de Contre-Preuves Identifiés ({transaction.counter_evidence?.length || 0})
                </h4>
                {(transaction.counter_evidence?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded bg-[#0A192C]">
                    Aucun facteur atténuant ou contre-preuve identifié pour déduire des points.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(transaction.counter_evidence || []).map((ce) => (
                      <div
                        key={ce.id}
                        className="p-4 rounded-xl bg-[#0A192C] border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              {ce.id}
                            </span>
                            <span className="font-bold text-xs text-white">{ce.title}</span>
                          </div>
                          <span className="font-black text-emerald-400 text-xs font-mono">-{ce.deduction} pts</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2.5 bg-[#060D17] p-3 rounded-lg border border-emerald-500/20 leading-relaxed">
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
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3C64F] flex items-center gap-2">
                  <User className="w-4 h-4" /> Dossier KYC Titulaire du Compte
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Nom Complet du Client</span>
                    <strong className="text-white block mt-0.5 text-xs font-bold">{transaction.customer.customer_name}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Code Client CIF</span>
                    <strong className="font-mono text-cyan-300 block mt-0.5">{transaction.customer.customer_id}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Segment Client</span>
                    <strong className="text-[#F3C64F] block mt-0.5">{transaction.customer.customer_segment} ({transaction.customer.customer_type})</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Niveau de Risque KYC</span>
                    <strong className="text-white block mt-0.5">{transaction.customer.kyc_risk_band}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Ancienneté Relation Client</span>
                    <strong className="text-white block mt-0.5 font-mono">{transaction.customer.relationship_tenure_days} jours</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Statut PEP (Personne Exposée)</span>
                    <strong className={transaction.customer.pep_flag ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                      {transaction.customer.pep_flag ? 'OUI (Vigilance Renforcée)' : 'NON'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Historical Median & Spending Comparison */}
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Analyse Comportementale vs Médiane 90 Jours
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Montant Transaction</span>
                    <strong className="text-white text-sm block mt-0.5 font-bold font-mono">
                      ${transaction.transaction.amount_usd_equiv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Médiane Client 90j</span>
                    <strong className="text-slate-200 text-sm block mt-0.5 font-mono">
                      ${transaction.customer.median_usd_90d?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Ratio Montant / Médiane</span>
                    <strong className={`text-sm block mt-0.5 font-mono ${transaction.transaction.amount_to_median_ratio >= 5.0 ? 'text-red-400 font-black' : 'text-emerald-400 font-bold'}`}>
                      {transaction.transaction.amount_to_median_ratio}x
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Flux Entrants Mensuels</span>
                    <strong className="text-slate-200 text-sm block mt-0.5 font-mono">
                      ${transaction.customer.monthly_inflow_usd_equiv?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Ledger Balance Flow */}
                <div className="p-3.5 rounded-lg bg-[#060D17] border border-[#1E3E66] flex items-center justify-between text-xs flex-wrap gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Solde Avant Opération</span>
                    <strong className="text-white font-mono">${transaction.account.available_balance_before_usd?.toLocaleString()}</strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mouvement Débit/Crédit</span>
                    <strong className={`font-mono ${transaction.transaction.direction === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {transaction.transaction.direction} ${transaction.transaction.amount_usd_equiv.toLocaleString()}
                    </strong>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Solde Après Opération</span>
                    <strong className="text-white font-mono">${transaction.account.available_balance_after_usd?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Beneficiary Details */}
              {transaction.counterparty.beneficiary_id && (
                <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Fiche Contrepartie / Bénéficiaire
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Nom du Bénéficiaire</span>
                      <strong className="text-white block mt-0.5 font-bold">{transaction.counterparty.beneficiary_name}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Identifiant Compte</span>
                      <strong className="font-mono text-purple-300 block mt-0.5">{transaction.counterparty.beneficiary_id}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Type / Lien Juridique</span>
                      <strong className="text-slate-200 block mt-0.5">{transaction.counterparty.beneficiary_type} &bull; {transaction.counterparty.beneficiary_relationship}</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Historique Antérieur</span>
                      <strong className="text-white block mt-0.5 font-mono">{transaction.counterparty.beneficiary_prior_txn_count} txns préalables</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Émetteurs Distincts (30j)</span>
                      <strong className={`font-mono ${Number(transaction.counterparty.beneficiary_distinct_sender_count_30d) >= 5 ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                        {transaction.counterparty.beneficiary_distinct_sender_count_30d} comptes
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                      <span className="text-slate-400 block text-[10px]">Âge du Bénéficiaire</span>
                      <strong className="text-slate-200 block mt-0.5 font-mono">{transaction.counterparty.beneficiary_age_days} jours</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'telemetry' ? (
            /* TAB 3: DEVICE & SESSION TELEMETRY */
            <div className="space-y-5">
              {/* Hardware Fingerprint */}
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Laptop className="w-4 h-4" /> Empreinte Matérielle &amp; Touchpoint Bancaire
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Identifiant Terminal / Device ID</span>
                    <strong className="font-mono text-cyan-300 block mt-0.5">{transaction.device_and_session.device_id || 'TERMINAL_CBS'}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Type Matériel &amp; Système OS</span>
                    <strong className="text-white block mt-0.5">{transaction.device_and_session.device_type} &bull; {transaction.device_and_session.device_os}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Usage Multi-Comptes (30j)</span>
                    <strong className={`font-mono ${transaction.device_and_session.device_accounts_seen_30d >= 3 ? 'text-red-400 font-black' : 'text-slate-200'}`}>
                      {transaction.device_and_session.device_accounts_seen_30d} Comptes
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Appairage Dispositif</span>
                    <strong className="text-white block mt-0.5 font-mono">{transaction.device_and_session.device_first_seen_days} jours</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Point d'Accès / Touchpoint</span>
                    <strong className="text-white block mt-0.5">{transaction.device_and_session.touchpoint_type} ({transaction.device_and_session.touchpoint_id})</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Mode Saisie Carte</span>
                    <strong className="text-slate-200 block mt-0.5">{transaction.device_and_session.card_entry_mode}</strong>
                  </div>
                </div>
              </div>

              {/* IP & Geolocation Security Signals */}
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Géolocalisation IP &amp; Impossible Travel
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Localisation IP</span>
                    <strong className="text-white block mt-0.5">{transaction.device_and_session.ip_city}, {transaction.device_and_session.ip_country}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Score Risque IP</span>
                    <strong className={`font-mono ${transaction.device_and_session.ip_risk_score > 60 ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                      {transaction.device_and_session.ip_risk_score}/100
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Détection Proxy / VPN</span>
                    <strong className={transaction.device_and_session.vpn_proxy_flag ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                      {transaction.device_and_session.vpn_proxy_flag ? 'DÉTECTÉ (Alerte)' : 'CONFORME'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Ville Précédente</span>
                    <strong className="text-slate-200 block mt-0.5 font-mono">
                      {transaction.device_and_session.previous_txn_city || 'N/A'} ({transaction.device_and_session.minutes_since_prev_txn ? `${transaction.device_and_session.minutes_since_prev_txn}m` : '1er Txn'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Authentication & Security Telemetry */}
              <div className="bank-card rounded-xl p-5 border border-[#1E3E66] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Télémétrie d'Authentification &amp; Identifiants
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Méthode d'Auth</span>
                    <strong className="text-white block mt-0.5">{transaction.auth_and_security.auth_method}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Échecs Connexion (30m)</span>
                    <strong className={`font-mono ${transaction.auth_and_security.login_failures_30m >= 3 ? 'text-red-400 font-black' : 'text-slate-200'}`}>
                      {transaction.auth_and_security.login_failures_30m} Tentatives
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Reset Mot de Passe</span>
                    <strong className={transaction.auth_and_security.password_reset_hours_ago !== null ? 'text-amber-400 font-bold font-mono' : 'text-slate-400'}>
                      {transaction.auth_and_security.password_reset_hours_ago !== null ? `il y a ${transaction.auth_and_security.password_reset_hours_ago}h` : 'Aucun'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="text-slate-400 block text-[10px]">Swap Carte SIM</span>
                    <strong className={transaction.auth_and_security.sim_swap_days_ago !== null ? 'text-red-400 font-bold font-mono' : 'text-slate-400'}>
                      {transaction.auth_and_security.sim_swap_days_ago !== null ? `il y a ${transaction.auth_and_security.sim_swap_days_ago}j` : 'Aucun'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 4: SENTIENT COPILOT (USE CASE 02) */
            <CopilotPanel transaction={transaction} />
          )}
        </div>

        {/* Drawer Official Action Footer */}
        <div className="p-4 border-t border-[#1E3E66] bg-[#0A192C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Dossier: <strong className="text-white font-mono">{transaction?.alert_evaluation.case_id || 'CAS-RB-SURV'}</strong> &bull; File: <strong className="text-[#F3C64F]">{transaction?.alert_evaluation.analyst_queue}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#0E223D] border border-[#1E3E66] hover:border-slate-500 text-slate-300 text-xs font-bold transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                alert(`Procédure conservatoire enregistrée pour ${transaction?.transaction.transaction_id}. Gel PND appliqué et escaladé au Comité Anti-Fraude.`);
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20 hover:brightness-110 active:scale-95 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Gel PND &amp; Escalade</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
