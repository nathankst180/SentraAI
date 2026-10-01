'use client';

import React from 'react';
import { AnalyticsData } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  MapPin,
  Smartphone
} from 'lucide-react';

interface ChartsGridProps {
  analytics: AnalyticsData | null;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#F4F7FB] p-3 rounded-lg border border-[#CBD5E1] shadow-md text-xs">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="flex items-center gap-2 text-slate-700">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold text-slate-900 font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsGrid: React.FC<ChartsGridProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl bg-[#E2E8F0] animate-pulse border border-[#CBD5E1]" />
        <div className="h-72 rounded-xl bg-[#E2E8F0] animate-pulse border border-[#CBD5E1]" />
      </div>
    );
  }

  const trends = analytics.daily_trends || [];
  const channelData = (analytics.channel_distribution || []).map((c) => ({
    name: (c.channel || '').replace(/_/g, ' '),
    alerts: c.alert_count,
    txns: c.total_txns,
    rate: c.alert_rate,
  }));
  const topCities = (analytics.geographic_distribution || []).slice(0, 5);
  const flaggedDevices = (analytics.top_risky_entities?.flagged_devices || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top 2 Simple Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="simple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Alert Volume Trends</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Last 90 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="critGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="alert_count"
                  name="Total Alerts"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#alertGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="critical_count"
                  name="Critical"
                  stroke="#DC2626"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#critGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Bar Chart */}
        <div className="simple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Alerts by Channel</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Distribution</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="alerts" name="Alerts" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 2 Clean Informational Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Regional Hubs */}
        <div className="simple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Top Regional Hubs</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">By Flagged Exposure</span>
          </div>
          <div className="divide-y divide-[#CBD5E1]/60">
            {topCities.map((city, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                  <span className="text-sm font-semibold text-slate-900">{city.city}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-600 font-medium">{city.alert_count} alerts</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${(city.exposure_usd / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Flagged Shared Hardware */}
        <div className="simple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-100/80 border border-red-200 flex items-center justify-center text-red-700">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">High-Risk Shared Hardware</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Mule Devices</span>
          </div>
          <div className="divide-y divide-[#CBD5E1]/60">
            {flaggedDevices.map((dev, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E2E8F0] text-slate-800 border border-[#CBD5E1]">
                    {dev.device_id}
                  </span>
                  <span className="text-sm text-slate-800 font-medium">{dev.device_type} &bull; {dev.device_os}</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="font-bold text-red-700 font-mono">{dev.accounts_seen} accounts</span>
                  <span className="text-slate-500 font-medium">{dev.alert_count} alerts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
