'use client';

import React from 'react';
import { KPIsData } from '@/types';
import {
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface KpiRibbonProps {
  kpis: KPIsData | null;
  isLoading?: boolean;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-[#E2E8F0] border border-[#CBD5E1] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Monitored Volume */}
      <div className="simple-card simple-card-hover p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Monitored Volume</span>
          <div className="w-7 h-7 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            ${(kpis.total_volume_usd / 1e6).toFixed(2)}M
          </span>
          <span className="text-xs text-slate-500">USD</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {kpis.total_transactions.toLocaleString()} total events
        </p>
      </div>

      {/* 2. Flagged Alerts */}
      <div className="simple-card simple-card-hover p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Flagged Alerts</span>
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.total_alerts.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">cases</span>
        </div>
        <p className="text-xs text-red-700 font-semibold mt-1">
          {kpis.critical_alerts} critical &bull; {kpis.high_alerts} high
        </p>
      </div>

      {/* 3. Financial Exposure */}
      <div className="simple-card simple-card-hover p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Exposure at Risk</span>
          <div className="w-7 h-7 rounded-lg bg-red-100/70 border border-red-200 flex items-center justify-center text-red-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-red-700 tracking-tight">
            ${(kpis.total_exposure_usd / 1e3).toFixed(0)}k
          </span>
          <span className="text-xs text-slate-500">USD</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {kpis.open_cases} open cases
        </p>
      </div>

      {/* 4. Anomaly Rate */}
      <div className="simple-card simple-card-hover p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Anomaly Rate</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.alert_rate}%
          </span>
          <span className="text-xs text-emerald-700 font-bold ml-1">Target Met</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Benchmark: 14% &ndash; 18%
        </p>
      </div>
    </div>
  );
};
