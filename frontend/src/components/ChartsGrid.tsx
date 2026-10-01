'use client';

import React from 'react';
import { AnalyticsData } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Radio,
  MapPin,
  Laptop,
  Users,
  Building2,
  ShieldAlert,
  Landmark,
  CreditCard,
  Smartphone,
  Globe2,
  AlertTriangle
} from 'lucide-react';

interface ChartsGridProps {
  analytics: AnalyticsData | null;
  isLoading?: boolean;
}

const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#F59E0B',
  LOW: '#0284C7',
};

const CHANNEL_COLORS: Record<string, string> = {
  ILLICOCASH: '#0284C7',
  RAWBANK_ONLINE: '#3B82F6',
  CARD: '#8B5CF6',
  ATM: '#10B981',
  SIOP: '#F59E0B',
  VISA_DIRECT: '#EC4899',
  AGENT_BANKING: '#6366F1',
  SWIFT_LIGHT: '#14B8A6',
  BRANCH: '#64748B',
};

export const ChartsGrid: React.FC<ChartsGridProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 h-80 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66] animate-pulse" />
        <div className="h-80 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66] animate-pulse" />
        <div className="h-80 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66] animate-pulse" />
        <div className="lg:col-span-2 h-80 rounded-xl bg-[#0E223D]/60 border border-[#1E3E66] animate-pulse" />
      </div>
    );
  }

  const trends = analytics.daily_trends || [];

  const channelData = (analytics.channel_distribution || []).map((c) => ({
    name: (c.channel || '').replace(/_/g, ' '),
    raw_channel: c.channel,
    alerts: c.alert_count,
    txns: c.total_txns,
    rate: c.alert_rate,
    volume: c.total_volume_usd,
    exposure: c.exposure_usd,
  }));

  const geoData = (analytics.geographic_distribution || []).slice(0, 6);

  return (
    <div className="space-y-6 mb-8">
      {/* Row 1: Time Series & Omnichannel Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 90-Day Anomaly & Threat Velocity Timeline */}
        <div className="lg:col-span-2 bank-card rounded-xl p-5 border border-[#1E3E66] shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#F3C64F]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Vélocité des Anomalies &amp; Menaces (Historique 90 Jours)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 ml-9">
                Évolution journalière des alertes générées avec pics critiques et seuils de risque
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs bg-[#060D17] px-3 py-1 rounded-lg border border-[#1E3E66]">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Total Alertes
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Alertes Critiques
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bankGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bankCritGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3E66" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickFormatter={(val: string) => {
                    const parts = val.split('-');
                    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                  minTickGap={25}
                />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#060D17',
                    borderColor: '#D4AF37',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  }}
                  labelStyle={{ color: '#F3C64F', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="alert_count"
                  name="Alertes Totales"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#bankGoldGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="critical_count"
                  name="Menaces Critiques"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#bankCritGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Omnichannel Threat Exposure */}
        <div className="bank-card rounded-xl p-5 border border-[#1E3E66] shadow-xl flex flex-col justify-between">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Exposition des Canaux Bancaires
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-9">
              Volume d'alertes par rail de paiement (Illicocash, CBS, Cartes, Swift)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3E66" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#CBD5E1" fontSize={9} width={85} />
                <Tooltip
                  formatter={(val: any, name: any) => [val, name === 'alerts' ? 'Dossiers Flagged' : 'Opérations']}
                  contentStyle={{
                    backgroundColor: '#060D17',
                    borderColor: '#1E3E66',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="alerts" name="Dossiers Flagged" fill="#D4AF37" radius={[0, 4, 4, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHANNEL_COLORS[entry.raw_channel] || '#0284C7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Geographic Concentration & Risky Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Hubs DRC */}
        <div className="bank-card rounded-xl p-5 border border-[#1E3E66] shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Pôles Régionaux RDC &amp; Agences
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-9">
              Concentration des alertes par ville et direction provinciale
            </p>
          </div>

          <div className="space-y-2.5">
            {geoData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#060D17]/80 border border-[#1E3E66]/80 hover:border-slate-500 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#142E52] text-[#F3C64F] font-bold flex items-center justify-center text-[10px] border border-[#1E3E66]">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200">{item.city}</span>
                    <p className="text-[10px] text-slate-400 font-mono">{item.total_txns} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#F3C64F]">{item.alert_count} alertes</span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ${(item.exposure_usd / 1000).toFixed(0)}k exp.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Shared Devices (FR-13) */}
        <div className="bank-card rounded-xl p-5 border border-[#1E3E66] shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Laptop className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Terminaux Multi-Comptes (FR-13)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-9">
              Empreintes matérielles liées à 3+ comptes bancaires distincts
            </p>
          </div>

          <div className="space-y-2.5">
            {(analytics.top_risky_entities?.flagged_devices || []).map((dev, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#060D17]/80 border border-[#1E3E66] flex items-center justify-between text-xs hover:border-purple-500/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{dev.device_id}</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 border border-purple-500/40 text-[10px] font-semibold">
                      {dev.device_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{dev.device_os}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40 text-[10px]">
                    {dev.accounts_seen} Comptes
                  </span>
                  <p className="text-[10px] text-[#F3C64F] mt-1 font-mono">{dev.alert_count} alertes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Risk Beneficiaries & Mule Detection (FR-14) */}
        <div className="bank-card rounded-xl p-5 border border-[#1E3E66] shadow-xl flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#F3C64F]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Bénéficiaires Suspects / Mules (FR-14)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-9">
              Comptes collecteurs recevant des fonds de 5+ donneurs d'ordre
            </p>
          </div>

          <div className="space-y-2.5">
            {(analytics.top_risky_entities?.suspicious_beneficiaries || []).map((ben, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#060D17]/80 border border-[#1E3E66] flex items-center justify-between text-xs hover:border-[#D4AF37]/50 transition-colors">
                <div className="max-w-[65%]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#F3C64F]">{ben.beneficiary_id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      {ben.beneficiary_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium truncate mt-0.5" title={ben.beneficiary_name}>
                    {ben.beneficiary_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40 text-[10px]">
                    {ben.max_senders} Émetteurs
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">${(ben.total_received_usd).toLocaleString()} USD</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
