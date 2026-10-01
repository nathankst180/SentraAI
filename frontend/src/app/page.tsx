'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { KpiRibbon } from '@/components/KpiRibbon';
import { ChartsGrid } from '@/components/ChartsGrid';
import { AlertsTable } from '@/components/AlertsTable';
import { InvestigationDrawer } from '@/components/InvestigationDrawer';
import { KPIsData, AnalyticsData, AlertItem, TransactionDrilldown } from '@/types';
import { fetchKPIs, fetchAnalytics, fetchAlerts, fetchTransaction } from '@/lib/api';
import {
  ShieldCheck,
  AlertCircle,
  Landmark,
  LayoutDashboard,
  Layers,
  MapPin,
  Users,
  Download,
  Lock,
  RefreshCw,
  FileCheck2,
  Building2,
  CreditCard
} from 'lucide-react';

export default function SentraAICommandCentre() {
  const [mounted, setMounted] = useState(false);

  // Active Banking View Tab: 'overview' | 'ledger' | 'channels' | 'syndicates'
  const [activePortalTab, setActivePortalTab] = useState<'overview' | 'ledger' | 'channels' | 'syndicates'>('overview');

  // State
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

  // Selected Transaction for Forensic Drilldown Drawer
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<TransactionDrilldown | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Loading & Error States
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
      setErrorMessage(err.message || 'Échec de connexion au serveur Rawbank Core SentraAI');
    } finally {
      setIsLoadingKPIs(false);
    }
  }, []);

  // 2. Fetch Analytics Data
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading Analytics:', err);
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

  // Initial load
  useEffect(() => {
    setMounted(true);
    loadKPIs();
    loadAnalytics();
  }, [loadKPIs, loadAnalytics]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Open Forensic Drilldown
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
      <div className="min-h-screen bg-[#060D17] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07101D] text-slate-100 flex flex-col font-sans">
      {/* Top Operational Header */}
      <Header
        onRefresh={handleRefreshAll}
        isLoading={isLoadingKPIs || isLoadingAnalytics || isLoadingAlerts}
        totalTxns={kpis?.total_transactions || 2500}
        totalAlerts={kpis?.total_alerts || 374}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert Banner if Backend is down */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>
                <strong>Avis de Connexion au Serveur Bancaire:</strong> {errorMessage}. Assurez-vous que le serveur FastAPI tourne sur <code className="bg-red-900/50 px-1 py-0.5 rounded font-mono">http://localhost:8000</code>.
              </span>
            </div>
            <button
              onClick={handleRefreshAll}
              className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold transition-all text-xs shrink-0 active:scale-95"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Bank Portal Module Tabs & Executive Actions Bar */}
        <div className="bank-card rounded-xl p-2.5 border border-[#1E3E66] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
            <button
              onClick={() => setActivePortalTab('overview')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                activePortalTab === 'overview'
                  ? 'bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#142E52]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Vue d'Ensemble &amp; Trésorerie</span>
            </button>

            <button
              onClick={() => setActivePortalTab('ledger')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                activePortalTab === 'ledger'
                  ? 'bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#142E52]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Grand Livre &amp; File de Triage ({totalAlerts})</span>
            </button>

            <button
              onClick={() => setActivePortalTab('channels')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                activePortalTab === 'channels'
                  ? 'bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#142E52]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Cartographie &amp; Pôles RDC</span>
            </button>

            <button
              onClick={() => setActivePortalTab('syndicates')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
                activePortalTab === 'syndicates'
                  ? 'bg-gradient-to-r from-[#F3C64F] to-[#D4AF37] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#142E52]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Comptes Mules &amp; Dispositifs (FR-13/14)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Génération du rapport réglementaire SAR / BCC en cours de téléchargement...")}
              className="px-3 py-1.5 rounded-lg bg-[#0E223D] hover:bg-[#142E52] border border-[#1E3E66] hover:border-[#D4AF37]/50 text-slate-200 hover:text-[#F3C64F] text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Exporter rapport réglementaire"
            >
              <Download className="w-3.5 h-3.5 text-[#F3C64F]" />
              <span className="hidden sm:inline">Rapport BCC (SAR)</span>
            </button>

            <button
              onClick={() => alert("Simulation du moteur de règles FR-01 à FR-20 sur la base de test Rawbank.")}
              className="px-3 py-1.5 rounded-lg bg-[#0E223D] hover:bg-[#142E52] border border-[#1E3E66] hover:border-cyan-400/50 text-slate-200 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Audit ISO 27001</span>
            </button>
          </div>
        </div>

        {/* Section 1: Executive Bank KPI Matrix */}
        <KpiRibbon kpis={kpis} isLoading={isLoadingKPIs} />

        {/* Section 2: Recharts Intelligence & Trend Grid */}
        <ChartsGrid analytics={analytics} isLoading={isLoadingAnalytics} />

        {/* Section 3: Core Banking Transaction Ledger & Case Queue */}
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
      </main>

      {/* Slide-over Forensic Drill-Down Drawer */}
      <InvestigationDrawer
        transaction={drilldownData}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        isLoading={isLoadingDrilldown}
      />

      {/* Official Bank Compliance Footer */}
      <footer className="border-t border-[#1E3E66] bg-[#060D17] px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 mt-12">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <Landmark className="w-3.5 h-3.5 text-[#F3C64F]" />
          </div>
          <span>
            <strong className="text-white">RAWBANK S.A.</strong> &bull; Direction du Contrôle des Risques &amp; SentraAI Anti-Fraude &bull; Kinshasa (RDC)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Banque Centrale du Congo (BCC) Conformité 100%</span>
          <span>&bull;</span>
          <span className="font-mono text-slate-300">Canonique: RAWBANK_SENTIENT_KB.csv (2,500 Lignes)</span>
        </div>
      </footer>
    </div>
  );
}
