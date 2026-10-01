'use client';

import React from 'react';
import {
  RefreshCw,
  Landmark
} from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading?: boolean;
  totalTxns?: number;
  totalAlerts?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading = false,
  totalTxns = 2500,
  totalAlerts = 374,
}) => {
  return (
    <header className="bg-[#F4F7FB] border-b border-[#CBD5E1] sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">Rawbank</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 border border-blue-200">
                SentraAI
              </span>
            </div>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-[#E8EEF5] px-2.5 py-1.5 rounded-md border border-[#CBD5E1]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">{totalTxns.toLocaleString()} Transactions Active</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8EEF5] hover:bg-[#DDE5EE] text-slate-800 border border-[#CBD5E1] text-xs font-medium transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
