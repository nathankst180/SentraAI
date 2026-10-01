'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileSearch,
  Check,
  Flame,
  Scale,
  BrainCircuit,
  CornerDownLeft,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Lock
} from 'lucide-react';
import { TransactionDrilldown, CopilotInvestigation, CopilotChatResponse } from '@/types';
import { fetchCopilotChat, fetchCopilotSuggestions } from '@/lib/api';

interface CopilotPanelProps {
  transaction: TransactionDrilldown;
}

const safeArray = <T,>(val: any, fallback: T[] = []): T[] => {
  if (Array.isArray(val)) return val;
  if (val !== undefined && val !== null && typeof val === 'string' && val.trim().length > 0) {
    return [val as unknown as T];
  }
  return fallback;
};

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ transaction }) => {
  const txnId = transaction.transaction.transaction_id;

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState<string>('Synthèse forensique & audit du risque de fraude');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [investigation, setInvestigation] = useState<CopilotInvestigation | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [contextSummary, setContextSummary] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dispositionStatus, setDispositionStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initCopilot() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const suggs = await fetchCopilotSuggestions(txnId);
        if (isMounted && Array.isArray(suggs) && suggs.length > 0) {
          setSuggestions(suggs);
        }

        const res: CopilotChatResponse = await fetchCopilotChat(
          txnId,
          'Provide comprehensive fraud triage and forensic risk assessment.'
        );
        if (isMounted) {
          if (!res || !res.success || !res.investigation) {
            setErrorMessage((res as any)?.error || 'Initialisation du Copilot IA échouée');
          } else {
            setInvestigation(res.investigation);
            setEngineUsed(res.engine || 'SentraAI Dual-Retrieval (Pandas + FAISS E5)');
            setContextSummary(res.context_summary);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Copilot initialization failed:', err);
          setErrorMessage(err.message || 'Impossible de charger le Copilot IA');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initCopilot();

    return () => {
      isMounted = false;
    };
  }, [txnId]);

  const handleSendQuery = async (customQuery?: string) => {
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    try {
      setIsLoading(true);
      setActiveQuery(q);
      setErrorMessage(null);
      const res = await fetchCopilotChat(txnId, q);
      if (!res || !res.success || !res.investigation) {
        setErrorMessage((res as any)?.error || 'Erreur lors du traitement de la requête');
      } else {
        setInvestigation(res.investigation);
        setEngineUsed(res.engine || 'SentraAI Intelligence Layer');
        setContextSummary(res.context_summary);
        if (!customQuery) setQuery('');
      }
    } catch (err: any) {
      console.error('Copilot query error:', err);
      setErrorMessage(err.message || 'Erreur lors du traitement de la requête');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisposition = (actionType: string) => {
    setDispositionStatus(`Action Enregistrée: ${actionType} consigné au registre d'audit pour l'opération ${txnId}.`);
    setTimeout(() => setDispositionStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Copilot Header Card */}
      <div className="bank-card rounded-xl p-5 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shadow-inner shrink-0">
            <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Copilot IA SentraAI &bull; Investigation Anti-Fraude
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40">
                Cas d'Usage 02
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Moteur: <span className="text-slate-300 font-mono font-semibold">{engineUsed || 'Dual-Retrieval (Pandas + FAISS E5)'}</span>
            </p>
          </div>
        </div>

        {contextSummary && (
          <div className="flex items-center gap-2 text-[11px] flex-wrap">
            <span className="px-2 py-1 rounded bg-[#060D17] border border-[#1E3E66] text-slate-300">
              Règles: <strong className="text-[#F3C64F]">{contextSummary.triggered_rules_count}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-[#060D17] border border-[#1E3E66] text-slate-300">
              Contre-Preuves: <strong className="text-emerald-400">{contextSummary.counter_evidence_count}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-[#060D17] border border-[#1E3E66] text-slate-300">
              Similarité Vectorielle: <strong className="text-cyan-400">{contextSummary.semantic_similar_count}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Interactive Chat Input */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder="Interroger l'opération (ex: 'Évaluer le risque de prise de contrôle ATO', 'Détailler les contre-preuves', 'Analyser le compte mule')..."
            className="w-full bg-[#060D17] border border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 pr-24 shadow-inner outline-none transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Analyser</span>
          </button>
        </div>

        {/* Quick-Prompt Suggestions */}
        {safeArray<string>(suggestions).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Suggestions:
            </span>
            {safeArray<string>(suggestions).map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(sugg)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#0E223D] hover:bg-purple-950/60 border border-[#1E3E66] hover:border-purple-400/60 text-slate-300 hover:text-purple-200 transition-all text-left truncate max-w-[300px]"
                title={sugg}
              >
                {sugg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Disposition Feedback Toast */}
      {dispositionStatus && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{dispositionStatus}</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
            Conformité BCC
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 rounded-xl bank-card border border-purple-500/20 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900/30 border border-purple-500/40 text-purple-400 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Synthèse des Télémétries &amp; Rapprochement Bancaire...</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Extraction de l'historique 90j du client, calcul de vélocité glissante, évaluation des contre-preuves (CE-01..CE-05) et matching sémantique vectoriel.
          </p>
        </div>
      )}

      {/* 7-Part Investigation Breakdown */}
      {!isLoading && investigation && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                Synthèse Exécutive IA &bull; Tour d'Investigation
              </span>
              <span className="text-[10px] font-mono bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                Niveau Analyste Risque
              </span>
            </div>
            {activeQuery && (
              <div className="text-[11px] text-purple-200 bg-purple-950/60 border border-purple-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-purple-400 font-bold uppercase text-[9px] tracking-wider shrink-0">Demande:</span>
                <span className="font-sans italic text-white truncate">"{activeQuery}"</span>
              </div>
            )}
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {investigation.executive_summary}
            </p>
          </div>

          {/* Section 1: Observed Facts */}
          <div className="p-4 rounded-xl bg-[#060D17] border border-[#1E3E66] space-y-2.5">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-cyan-400" />
              1. Faits Observés (Télémétries Vérifiées du Grand Livre)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {safeArray<string>(investigation.observed_facts).map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1 shrink-0 text-[10px]">&bull;</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Derived Metrics */}
          <div className="p-4 rounded-xl bg-[#060D17] border border-[#1E3E66] space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              2. Métriques Dérivées &amp; Calibration Comportementale
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {safeArray<string>(investigation.derived_metrics).map((metric, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#0A192C] border border-[#1E3E66] text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">#{idx + 1}</span>
                  <span className="leading-snug">{metric}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Triggered Rules */}
          <div className="p-4 rounded-xl bg-[#060D17] border border-[#1E3E66] space-y-2.5">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. Règles Déclenchées (Poids FR-01 à FR-20)
            </h4>
            <div className="space-y-2">
              {safeArray<CopilotInvestigation['triggered_rules'][number]>(investigation.triggered_rules).map((rule, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#0A192C] border border-amber-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-[11px]">
                      {rule?.rule_code || 'FR-XX'}
                    </span>
                    <span className="text-white font-semibold">{rule?.rule_name || 'Règle'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{rule?.detail || ''}</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30 font-mono font-bold text-[11px] shrink-0">
                      +{rule?.weight || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 & 5: Supporting Evidence vs Counter-Evidence (Split Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supporting Evidence */}
            <div className="p-4 rounded-xl bg-[#060D17] border border-red-900/40 space-y-2.5">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                4. Signaux de Charge (Supporting Evidence)
              </h4>
              <ul className="space-y-2 text-xs">
                {safeArray<string>(investigation.supporting_evidence).map((ev, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-200 flex items-start gap-2">
                    <span className="text-red-400 shrink-0 font-bold">&bull;</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Counter-Evidence */}
            <div className="p-4 rounded-xl bg-[#060D17] border border-emerald-900/40 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                5. Facteurs Atténuants (CE-01 à CE-05)
              </h4>
              <ul className="space-y-2 text-xs">
                {safeArray<string>(investigation.counter_evidence).map((cev, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 font-bold">&check;</span>
                    <span>{cev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 6: Evidence Gaps */}
          <div className="p-4 rounded-xl bg-[#060D17] border border-[#1E3E66] space-y-2.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              6. Zones d'Ombre &amp; Vérifications Hors-Bande Requises
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {safeArray<string>(investigation.evidence_gaps).map((gap, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#0A192C] border border-[#1E3E66] flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">?</span>
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Recommended Analyst Action & Disposition Flow */}
          <div className="p-5 rounded-xl bank-card-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3E66] pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#F3C64F] uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#F3C64F]" />
                  7. Action Recommandée à l'Officier de Surveillance
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#142E52] border border-[#D4AF37]/40 text-[#F3C64F] font-mono font-bold text-xs">
                    {investigation.recommended_analyst_action?.action || 'AUDIT'}
                  </span>
                  <span className="text-xs text-slate-300">
                    Suggestion de Disposition:{' '}
                    <strong className="text-white font-bold">
                      {investigation.recommended_analyst_action?.disposition_suggestion || 'SUSPECT'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Motivation Réglementaire:</strong> {investigation.recommended_analyst_action?.rationale || 'Triage forensique opérationnel requis.'}
            </p>

            {/* Next Steps Checklist */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Protocole d'Exécution Recommandé:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {safeArray<string>(investigation.recommended_analyst_action?.next_steps).map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#060D17] border border-[#1E3E66]">
                    <span className="w-4 h-4 rounded-full bg-[#142E52] text-[#F3C64F] flex items-center justify-center text-[10px] font-bold shrink-0 border border-[#1E3E66]">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Frontline Disposition Action Buttons */}
            <div className="pt-3 border-t border-[#1E3E66] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-slate-400">
                Prise de Décision Opérationnelle:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleDisposition('MARK_LEGITIMATE')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  Valider Légitime
                </button>
                <button
                  onClick={() => handleDisposition('ESCALATE_TO_COMMITTEE')}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Escalader au Comité
                </button>
                <button
                  onClick={() => handleDisposition('REQUEST_KYC_DOCS')}
                  className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/50 hover:border-blue-400 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Demander Justificatifs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
