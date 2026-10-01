'use client';

import React from 'react';
import { AnalyticsData } from '@/types';
import { Smartphone, Users, UserX } from 'lucide-react';

interface RiskyEntitiesProps {
  analytics: AnalyticsData | null;
  isLoading?: boolean;
}

export const RiskyEntities: React.FC<RiskyEntitiesProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 rounded-xl bg-[#E2E8F0] animate-pulse border border-[#CBD5E1]" />
        <div className="h-64 rounded-xl bg-[#E2E8F0] animate-pulse border border-[#CBD5E1]" />
        <div className="h-64 rounded-xl bg-[#E2E8F0] animate-pulse border border-[#CBD5E1]" />
      </div>
    );
  }

  const { top_customers = [], suspicious_beneficiaries = [], flagged_devices = [] } =
    analytics.top_risky_entities || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Flagged Devices (Mule Hardware / Shared Accounts) */}
      <div className="simple-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-100/80 border border-red-200 flex items-center justify-center text-red-700">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Flagged Shared Devices</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">FR-14 Rule</span>
          </div>

          <div className="divide-y divide-[#CBD5E1]/60">
            {flagged_devices.slice(0, 6).map((dev, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-mono font-bold text-slate-900">{dev.device_id}</p>
                  <p className="text-slate-500">{dev.device_type} &bull; {dev.device_os}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                    {dev.accounts_seen} accounts
                  </span>
                  <p className="text-slate-500 font-medium mt-0.5">{dev.alert_count} alerts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Top High-Risk Customers */}
      <div className="simple-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-800">
                <UserX className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">High-Risk Accounts</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Repeated Alerts</span>
          </div>

          <div className="divide-y divide-[#CBD5E1]/60">
            {top_customers.slice(0, 6).map((cust, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{cust.customer_name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{cust.customer_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 font-mono">${(cust.total_exposure_usd / 1000).toFixed(1)}k</p>
                  <p className="text-red-700 font-bold text-[11px]">{cust.alert_count} alerts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Suspicious Beneficiaries */}
      <div className="simple-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700">
                <Users className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Mule Beneficiaries</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Fan-In Funnels</span>
          </div>

          <div className="divide-y divide-[#CBD5E1]/60">
            {suspicious_beneficiaries.slice(0, 6).map((ben, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 truncate max-w-[140px]">{ben.beneficiary_name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{ben.beneficiary_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 font-mono">${(ben.total_received_usd / 1000).toFixed(1)}k</p>
                  <span className="text-slate-500 font-medium">{ben.max_senders} senders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
