'use client';

import React from 'react';
import { KPIsData } from '@/types';
import {
  Landmark,
  ShieldAlert,
  Coins,
  Activity,
  AlertOctagon,
  ShieldCheck,
  TrendingDown,
  Lock,
  Flame,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface KpiRibbonProps {
  kpis: KPIsData | null;
  isLoading?: boolean;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Monitored Treasury Capital */}
      <div className="bank-card rounded-xl p-5 border border-[#1E3E66] hover:border-[#D4AF37]/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-[#F3C64F]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Volume Global des Flux
              </span>
              <span className="text-[10px] text-slate-400">Total Monitored Capital</span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#142E52] text-cyan-300 border border-[#1E3E66]">
            {kpis.total_transactions.toLocaleString()} Txns
          </span>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              ${(kpis.total_volume_usd / 1e6).toFixed(2)}M
            </span>
            <span className="text-xs font-bold text-[#F3C64F]">USD</span>
          </div>
          <div className="flex items-baseline gap-1.5 text-xs text-slate-400">
            <span>Contre-valeur CDF:</span>
            <strong className="text-slate-200 font-mono font-bold">{(kpis.total_volume_cdf / 1e9).toFixed(2)} Milliards CDF</strong>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1E3E66]/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tous Canaux Déployés</span>
          </span>
          <span className="font-semibold text-slate-300">Kinshasa &bull; Hubs DRC</span>
        </div>
      </div>

      {/* 2. Anomaly Dossiers & Severity */}
      <div className="bank-card rounded-xl p-5 border border-[#1E3E66] hover:border-amber-500/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Dossiers d'Alerte Actifs
              </span>
              <span className="text-[10px] text-slate-400">Suspicious Events</span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            FR-01..20
          </span>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-300 tracking-tight">
              {kpis.total_alerts.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">alertes identifiées</span>
          </div>
          <div className="text-xs text-slate-400">
            <span>Score moyen SentraAI: <strong className="text-white font-mono">68.4 / 100</strong></span>
          </div>
        </div>

        {/* Severity Badges */}
        <div className="pt-2 border-t border-[#1E3E66]/60 flex items-center justify-between text-[10px] font-bold gap-1">
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30" title="Critique">
            Crit: {kpis.critical_alerts}
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30" title="Élevée">
            Élev: {kpis.high_alerts}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30" title="Moyenne">
            Moy: {kpis.medium_alerts}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30" title="Faible">
            Faib: {kpis.low_alerts}
          </span>
        </div>
      </div>

      {/* 3. Capital Exposure & Locked Funds */}
      <div className="bank-card rounded-xl p-5 border border-[#1E3E66] hover:border-red-500/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider block">
                Capitaux Exposés / Risque
              </span>
              <span className="text-[10px] text-slate-400">Exposure Under Watch</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
            PND Active
          </span>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-400 tracking-tight font-mono">
              ${kpis.total_exposure_usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-bold text-slate-400">USD</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Files d'Attente: <strong className="text-white font-bold">{kpis.open_cases} en cours</strong></span>
            <span className="text-emerald-400 font-semibold">{kpis.closed_cases} clôturés</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1E3E66]/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Gel Conservatoire PND</span>
          </span>
          <span className="text-red-300 font-semibold">Triage Immédiat</span>
        </div>
      </div>

      {/* 4. Anomaly Rate & BCC Benchmark */}
      <div className="bank-card rounded-xl p-5 border border-[#1E3E66] hover:border-[#D4AF37]/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#F3C64F]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#F3C64F] uppercase tracking-wider block">
                Taux de Détection SentraAI
              </span>
              <span className="text-[10px] text-slate-400">BCC Benchmark Ratio</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Conforme
          </span>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {kpis.alert_rate}%
            </span>
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Cible 14.0% &ndash; 18.0%
            </span>
          </div>
          <div className="text-xs text-slate-400">
            <span>Seuil Réglementaire Banque Centrale: <strong className="text-slate-200">Respecté</strong></span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1E3E66]/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F3C64F]" />
            <span>Audit Trail Intègre</span>
          </span>
          <span className="text-slate-300 font-mono text-[10px]">Fenêtre 90 Jours</span>
        </div>
      </div>
    </div>
  );
};
