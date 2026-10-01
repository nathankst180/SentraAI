'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  RefreshCw,
  Database,
  Lock,
  Globe2,
  TrendingUp,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  CreditCard,
  UserCheck,
  Clock
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
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Africa/Kinshasa',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' Kinshasa (UTC+1)'
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#060D17] border-b border-[#1E3E66]/80 shadow-2xl">
      {/* 1. Top Interbank Treasury & Regulatory Ticker Bar */}
      <div className="bank-header-ticker px-4 sm:px-6 py-1.5 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-[#F3C64F]">
            <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>BANQUE CENTRALE DU CONGO (BCC) ACCREDITATION &bull; CODE: RB-CD-001</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-slate-400">
            <span>&bull;</span>
            <span>USD/CDF: <strong className="text-white font-mono">2,850.00</strong></span>
            <span>&bull;</span>
            <span>EUR/USD: <strong className="text-white font-mono">1.0855</strong></span>
            <span>&bull;</span>
            <span>SWIFT BIC: <strong className="text-cyan-300 font-mono">RAWBKCDK</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold">CORE FINACLE CBS: ONLINE (99.98% SLA)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px] bg-[#0A192C] px-2.5 py-0.5 rounded border border-[#1E3E66]">
            <Clock className="w-3 h-3 text-[#D4AF37]" />
            <span>{currentTime || '12:00:00 Kinshasa (UTC+1)'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Executive Bank Brand & Officer Command Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 bg-[#0A192C]/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F3C64F] via-[#D4AF37] to-[#8C7323] p-[2px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#060D17] rounded-[10px] flex items-center justify-center flex-col">
              <Landmark className="w-6 h-6 text-[#F3C64F]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black tracking-wider text-white flex items-center gap-1.5">
                RAWBANK
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#F3C64F] border border-[#D4AF37]/40 tracking-normal">
                  SENTRAAI ENTERPRISE
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-900/30 px-2.5 py-0.5 rounded border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CANONICAL KB (2,500 TXNS)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Direction du Contrôle des Risques &amp; Sécurité Financière &bull; Kinshasa Head Office (DRC)
            </p>
          </div>
        </div>

        {/* Live Subsystem Feeds & Operator Profile */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bank Engine Telemetry Badges */}
          <div className="hidden xl:flex items-center gap-3 bg-[#060D17]/80 px-3.5 py-1.5 rounded-lg border border-[#1E3E66] text-xs">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">DuckDB Core:</span>
              <span className="font-bold text-slate-100">Synchronized</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#F3C64F]" />
              <span className="text-slate-400">Règles Actives:</span>
              <span className="font-bold text-[#F3C64F]">FR-01 &ndash; FR-20</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">Canaux:</span>
              <span className="font-bold text-slate-200">Illicocash &bull; CBS</span>
            </div>
          </div>

          {/* Authenticated Officer Badge */}
          <div className="flex items-center gap-2 bg-[#0E223D] px-3 py-1.5 rounded-lg border border-[#1E3E66] text-xs">
            <div className="w-7 h-7 rounded-full bg-[#1A3A60] border border-[#D4AF37]/50 flex items-center justify-center text-[#F3C64F] font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <span className="font-bold text-white block text-[11px]">Officer: Risk L3</span>
              <span className="text-[10px] text-[#D4AF37] block font-mono">Surveillance DRC</span>
            </div>
          </div>

          {/* Refresh Core Feeds Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#142E52] to-[#0E223D] hover:from-[#1E3E66] hover:to-[#142E52] text-slate-200 hover:text-white border border-[#1E3E66] hover:border-[#D4AF37]/60 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Rafraîchir les flux du grand livre bancaire"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F3C64F] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Grand Livre</span>
          </button>
        </div>
      </div>
    </header>
  );
};
