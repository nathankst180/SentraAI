'use client';

import React, { useState } from 'react';
import { AlertItem } from '@/types';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye
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

export const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  selectedSeverity,
  selectedChannel,
  searchTerm,
  onPageChange,
  onSeverityChange,
  onChannelChange,
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E2E8F0] text-slate-700">
            {severity}
          </span>
        );
    }
  };

  return (
    <div className="simple-card overflow-hidden shadow-xs">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-[#CBD5E1] bg-[#F4F7FB] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by ID, customer, amount..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[#E8EEF5] border border-[#CBD5E1] focus:bg-[#EDF2F7] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              &times;
            </button>
          )}
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity Pills */}
          <div className="flex items-center gap-1 bg-[#E8EEF5] border border-[#CBD5E1] p-1 rounded-lg">
            {SEVERITIES.map((sev) => {
              const isActive = selectedSeverity.toUpperCase() === sev;
              return (
                <button
                  key={sev}
                  onClick={() => onSeverityChange(sev)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F4F7FB] text-slate-900 border border-[#CBD5E1] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Channel Dropdown */}
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="bg-[#E8EEF5] border border-[#CBD5E1] text-slate-800 font-medium text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch === 'ALL' ? 'All Channels' : ch.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-[#F4F7FB]">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-[#E8EEF5] text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-[#CBD5E1]">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Channel</th>
              <th className="py-3 px-3 text-right">Amount (USD)</th>
              <th className="py-3 px-3 text-center">Score</th>
              <th className="py-3 px-3 text-center">Severity</th>
              <th className="py-3 px-4">Pattern</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CBD5E1]/60">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse bg-[#E8EEF5]/40">
                  <td colSpan={9} className="py-4 px-4 h-12 bg-[#E2E8F0]/50" />
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                  No alerts found matching current filters.
                </td>
              </tr>
            ) : (
              alerts.map((row, idx) => {
                const isSelected = selectedTxnId === row.transaction_id;
                const isAlt = idx % 2 === 1;
                return (
                  <tr
                    key={row.transaction_id}
                    onClick={() => onSelectTransaction(row.transaction_id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-100/70 font-medium'
                        : isAlt
                        ? 'bg-[#EEF3F8] hover:bg-[#E2EAF3]'
                        : 'bg-[#F4F7FB] hover:bg-[#E2EAF3]'
                    }`}
                  >
                    {/* Transaction ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {row.transaction_id}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {row.event_timestamp_local.replace('T', ' ').substring(0, 16)}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                          {row.customer_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {row.customer_id} &bull; {row.customer_segment}
                        </span>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-3">
                      <span className="text-slate-900 font-medium block">
                        {row.channel.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                        {row.channel_action}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      ${row.amount_usd_equiv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                      {row.alert_score}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 text-center">
                      {getSeverityBadge(row.alert_severity)}
                    </td>

                    {/* Pattern */}
                    <td className="py-3 px-4 text-slate-700 truncate max-w-[170px] font-medium">
                      {row.alert_primary_pattern ? row.alert_primary_pattern.replace(/_/g, ' ') : 'CONTROL LIMIT'}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(row.transaction_id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#E2E8F0] hover:bg-[#CBD5E1] text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inspect</span>
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
      <div className="p-3 border-t border-[#CBD5E1] bg-[#E8EEF5] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} alerts
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1 rounded bg-[#F4F7FB] border border-[#CBD5E1] text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-[#E2E8F0] transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-slate-900 px-2">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1 rounded bg-[#F4F7FB] border border-[#CBD5E1] text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-[#E2E8F0] transition-colors cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
