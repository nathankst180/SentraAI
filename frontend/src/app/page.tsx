'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { KpiRibbon } from '@/components/KpiRibbon';
import { ChartsGrid } from '@/components/ChartsGrid';
import { AlertsTable } from '@/components/AlertsTable';
import { RiskyEntities } from '@/components/RiskyEntities';
import { InvestigationDrawer } from '@/components/InvestigationDrawer';
import { FloatingWhatsAppCopilot } from '@/components/FloatingWhatsAppCopilot';
import { KPIsData, AnalyticsData, AlertItem, TransactionDrilldown } from '@/types';
import { fetchKPIs, fetchAnalytics, fetchAlerts, fetchTransaction } from '@/lib/api';
import {
  ShieldAlert,
  BarChart3,
  Users2,
  AlertCircle
} from 'lucide-react';

export default function SentraAIPortal() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'entities'>('queue');

  // Core Data States
  const [kpis, setKpis] = useState<KPIsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedQueue, setSelectedQueue] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Transaction for Drawer
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<TransactionDrilldown | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Loading States
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoadingDrilldown, setIsLoadingDrilldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Executive KPIs
  const loadKPIs = useCallback(async () => {
    try {
      setIsLoadingKPIs(true);
      const data = await fetchKPIs();
      setKpis(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Error loading KPIs:', err);
      setErrorMessage(err.message || 'Failed to connect to SentraAI backend service');
    } finally {
      setIsLoadingKPIs(false);
    }
  }, []);

  // 2. Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // 3. Fetch Alert Queue
  const loadAlerts = useCallback(async () => {
    try {
      setIsLoadingAlerts(true);
      const res = await fetchAlerts({
        page,
        pageSize,
        severity: selectedSeverity,
        channel: selectedChannel,
        queue: selectedQueue,
        search: searchTerm,
      });
      setAlerts(res.items);
      setTotalAlerts(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [page, pageSize, selectedSeverity, selectedChannel, selectedQueue, searchTerm]);

  useEffect(() => {
    setMounted(true);
    loadKPIs();
    loadAnalytics();
  }, [loadKPIs, loadAnalytics]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleSelectTransaction = async (txnId: string) => {
    setSelectedTxnId(txnId);
    setIsDrawerOpen(true);
    setIsLoadingDrilldown(true);
    try {
      const data = await fetchTransaction(txnId);
      setDrilldownData(data);
    } catch (err: any) {
      console.error('Failed to load transaction drilldown:', err);
    } finally {
      setIsLoadingDrilldown(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleRefreshAll = () => {
    loadKPIs();
    loadAnalytics();
    loadAlerts();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#E8EEF5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EEF5] text-slate-900 flex flex-col font-sans">
      {/* Simple Clean Porcelain Header */}
      <Header
        onRefresh={handleRefreshAll}
        isLoading={isLoadingKPIs || isLoadingAnalytics || isLoadingAlerts}
        totalTxns={kpis?.total_transactions || 2500}
        totalAlerts={kpis?.total_alerts || 374}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notice if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-100 border border-red-300 text-red-900 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={handleRefreshAll}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* High-Level Overview Metrics */}
        <KpiRibbon kpis={kpis} isLoading={isLoadingKPIs} />

        {/* Clean Segmented Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#CBD5E1] pb-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#DDE5EE]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Alerts Queue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'queue' ? 'bg-blue-700 text-white' : 'bg-[#CBD5E1] text-slate-800'
              }`}
            >
              {totalAlerts}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#DDE5EE]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &amp; Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'entities'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#DDE5EE]'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Flagged Entities &amp; Devices</span>
          </button>
        </div>

        {/* Tab View Content */}
        {activeTab === 'queue' && (
          <AlertsTable
            alerts={alerts}
            total={totalAlerts}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            isLoading={isLoadingAlerts}
            selectedSeverity={selectedSeverity}
            selectedChannel={selectedChannel}
            selectedQueue={selectedQueue}
            searchTerm={searchTerm}
            onPageChange={(p) => setPage(p)}
            onSeverityChange={(sev) => {
              setSelectedSeverity(sev);
              setPage(1);
            }}
            onChannelChange={(ch) => {
              setSelectedChannel(ch);
              setPage(1);
            }}
            onQueueChange={(q) => {
              setSelectedQueue(q);
              setPage(1);
            }}
            onSearchChange={(q) => {
              setSearchTerm(q);
              setPage(1);
            }}
            onSelectTransaction={handleSelectTransaction}
            selectedTxnId={selectedTxnId}
          />
        )}

        {activeTab === 'analytics' && (
          <ChartsGrid analytics={analytics} isLoading={isLoadingAnalytics} />
        )}

        {activeTab === 'entities' && (
          <RiskyEntities analytics={analytics} isLoading={isLoadingAnalytics} />
        )}
      </main>

      {/* Slide-over Inspection Drawer */}
      <InvestigationDrawer
        transaction={drilldownData}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        isLoading={isLoadingDrilldown}
      />

      {/* Floating WhatsApp Style AI Copilot */}
      <FloatingWhatsAppCopilot />

      {/* Simple Clean Footer */}
      <footer className="border-t border-[#CBD5E1] bg-[#F4F7FB] px-6 py-4 text-xs text-slate-600 mt-12 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-800">
            Rawbank SentraAI &bull; Autonomous Fraud Surveillance &amp; Compliance Portal
          </p>
          <p className="text-slate-500 font-medium">
            Canonical Dataset: 2,500 Transactions &bull; Central Bank of Congo (BCC) Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}
