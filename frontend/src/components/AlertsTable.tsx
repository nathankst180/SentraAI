'use client';

import React, { useState } from 'react';
import { AlertItem } from '@/types';
import {
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  CreditCard,
  Building,
  User,
  Lock,
  Layers
} from 'lucide-react';

interface AlertsTableProps {
  alerts: AlertItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  selectedSeverity: string;
  selectedChannel: string;
  selectedQueue: string;
  searchTerm: string;
  onPageChange: (newPage: number) => void;
  onSeverityChange: (sev: string) => void;
  onChannelChange: (ch: string) => void;
  onQueueChange: (q: string) => void;
  onSearchChange: (query: string) => void;
  onSelectTransaction: (txnId: string) => void;
  selectedTxnId?: string | null;
}

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const CHANNELS = [
  'ALL',
  'ILLICOCASH',
  'RAWBANK_ONLINE',
  'CARD',
  'ATM',
  'SIOP',
  'VISA_DIRECT',
  'AGENT_BANKING',
  'SWIFT_LIGHT',
  'BRANCH'
];

const QUEUES = [
  'ALL',
  'DIGITAL_FRAUD',
  'CARD_FRAUD',
  'CORPORATE_FRAUD',
  'TIER_1_FRAUD',
  'TIER_2_FRAUD'
];

export const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  selectedSeverity,
  selectedChannel,
  selectedQueue,
  searchTerm,
  onPageChange,
  onSeverityChange,
  onChannelChange,
  onQueueChange,
  onSearchChange,
  onSelectTransaction,
  selectedTxnId,
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-950/80 text-red-300 border border-red-500/50 shadow-sm shadow-red-500/20">
            <Flame className="w-3 h-3 text-red-400" /> CRITIQUE
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-950/80 text-orange-300 border border-orange-500/50">
            <AlertTriangle className="w-3 h-3 text-orange-400" /> ÉLEVÉE
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <Info className="w-3 h-3 text-amber-400" /> MODÉRÉE
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/50">
            FAIBLE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
            {severity}
          </span>
        );
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs font-mono bg-red-900/40 text-red-300 border border-red-500/40">
          {score}/100
        </span>
      );
    }
    if (score >= 55) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs font-mono bg-orange-900/40 text-orange-300 border border-orange-500/40">
          {score}/100
        </span>
      );
    }
    if (score >= 35) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs font-mono bg-amber-900/40 text-amber-300 border border-amber-500/40">
          {score}/100
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs font-mono bg-blue-900/40 text-blue-300 border border-blue-500/40">
        {score}/100
      </span>
    );
  };

  return (
    <div className="bank-card rounded-xl border border-[#1E3E66] shadow-2xl overflow-hidden">
      {/* Table Header & Filter Bar */}
      <div className="p-5 border-b border-[#1E3E66] bg-[#0A192C]/95 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#F3C64F]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Grand Livre des Alertes &amp; File de Triage SentraAI
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Surveillance déterministe règles FR-01 à FR-20 avec déductions de contre-preuves
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[300px]">
            <input
              type="text"
              placeholder="Rechercher par Ref TXN, Nom Client, Compte CIF..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#060D17] border border-[#1E3E66] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            )}
          </form>
        </div>

        {/* Severity Filter Pills & Dropdown Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" /> Gravité:
            </span>
            {SEVERITIES.map((sev) => {
              const isActive = selectedSeverity.toUpperCase() === sev;
              return (
                <button
                  key={sev}
                  onClick={() => onSeverityChange(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? sev === 'CRITICAL'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : sev === 'HIGH'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : sev === 'LOW'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                      : 'bg-[#060D17] text-slate-400 hover:text-white border border-[#1E3E66] hover:border-slate-500'
                  }`}
                >
                  {sev === 'ALL' ? 'TOUTES LES ALERTES' : sev === 'CRITICAL' ? 'CRITIQUE' : sev === 'HIGH' ? 'ÉLEVÉE' : sev === 'MEDIUM' ? 'MODÉRÉE' : 'FAIBLE'}
                </button>
              );
            })}
          </div>

          {/* Channel and Queue Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedChannel}
              onChange={(e) => onChannelChange(e.target.value)}
              className="bg-[#060D17] border border-[#1E3E66] text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch === 'ALL' ? 'Tous Canaux Bancaires' : ch.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={selectedQueue}
              onChange={(e) => onQueueChange(e.target.value)}
              className="bg-[#060D17] border border-[#1E3E66] text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {QUEUES.map((q) => (
                <option key={q} value={q}>
                  {q === 'ALL' ? 'Toutes Files de Triage' : q.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#060D17] text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-[#1E3E66]">
            <tr>
              <th className="py-3.5 px-4">Ref Transaction</th>
              <th className="py-3.5 px-3">Date &amp; Heure (Kinshasa)</th>
              <th className="py-3.5 px-3">Titulaire / CIF</th>
              <th className="py-3.5 px-3">Canal &amp; Opération</th>
              <th className="py-3.5 px-3 text-right">Montant (USD / CDF)</th>
              <th className="py-3.5 px-3 text-center">Score SentraAI</th>
              <th className="py-3.5 px-3 text-center">Gravité</th>
              <th className="py-3.5 px-4">Typologie Détectée</th>
              <th className="py-3.5 px-4 text-center">Audit &amp; Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3E66]/60 bg-[#0A192C]/70">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse bg-[#0E223D]">
                  <td colSpan={9} className="py-4 px-4 h-12 bg-slate-800/20" />
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldAlert className="w-9 h-9 text-slate-500 mb-2" />
                    <p className="font-bold text-slate-200">Aucune opération suspecte dans ce filtre</p>
                    <p className="text-xs text-slate-500 mt-1">Ajustez vos filtres de gravité ou vos mots-clés de recherche.</p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((row) => {
                const isSelected = selectedTxnId === row.transaction_id;
                return (
                  <tr
                    key={row.transaction_id}
                    onClick={() => onSelectTransaction(row.transaction_id)}
                    className={`bank-table-row cursor-pointer ${
                      isSelected ? 'bg-[#142E52] border-l-4 border-l-[#D4AF37]' : ''
                    }`}
                  >
                    {/* Transaction Reference */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {row.transaction_id}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {row.event_timestamp_local.replace('T', ' ').substring(0, 19)}
                    </td>

                    {/* Customer Entity */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-white block truncate max-w-[190px]">
                          {row.customer_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono text-cyan-400">{row.customer_id}</span>
                          <span>&bull;</span>
                          <span className="text-[#F3C64F] font-semibold">{row.customer_segment}</span>
                        </div>
                      </div>
                    </td>

                    {/* Channel / Action */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-200 block">
                        {row.channel.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {row.channel_action}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className="font-black text-white block text-xs">
                        ${row.amount_usd_equiv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {row.amount.toLocaleString()} {row.currency}
                      </span>
                    </td>

                    {/* Alert Score */}
                    <td className="py-3.5 px-3 text-center">
                      {getScoreBadge(row.alert_score)}
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-3 text-center">
                      {getSeverityBadge(row.alert_severity)}
                    </td>

                    {/* Suspected Pattern */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#060D17] text-slate-300 border border-[#1E3E66] text-[11px] font-semibold inline-block truncate max-w-[180px]">
                        {row.alert_primary_pattern ? row.alert_primary_pattern.replace(/_/g, ' ') : 'CONTRÔLE PLAFOND'}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(row.transaction_id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#F3C64F] border border-[#D4AF37]/40 text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier 360&deg;</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#1E3E66] bg-[#060D17] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Affichage des opérations{' '}
          <strong className="text-white font-mono font-bold">
            {total === 0 ? 0 : (page - 1) * pageSize + 1}
          </strong>{' '}
          à{' '}
          <strong className="text-white font-mono font-bold">
            {Math.min(page * pageSize, total)}
          </strong>{' '}
          sur <strong className="text-white font-mono font-bold">{total.toLocaleString()}</strong> alertes en cours
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1.5 rounded-lg bg-[#0E223D] border border-[#1E3E66] hover:border-slate-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Page précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-semibold text-slate-200 px-2 font-mono">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-lg bg-[#0E223D] border border-[#1E3E66] hover:border-slate-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Page suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
