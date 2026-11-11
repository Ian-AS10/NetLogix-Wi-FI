/**
 * @file App.tsx
 * Aplicação frontend principal do NetLogix Wi-Fi IDS Dashboard.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { RiskGaugeCard } from './components/RiskGaugeCard.js';
import { TemporalCharts } from './components/TemporalCharts.js';
import { OptimizerComparisonCard } from './components/OptimizerComparisonCard.js';
import { RuleCatalogCard } from './components/RuleCatalogCard.js';
import { ControlDeck } from './components/ControlDeck.js';
import { AuditTerminal } from './components/AuditTerminal.js';
import { SystemStatus, MetricSnapshot, ThreatScenario } from './domain/metrics.js';
import { OptimizationComparison } from './domain/optimizer.js';
import { SecurityRule } from './domain/rules.js';
import { LogEntry } from './utils/logger.js';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const [comparison, setComparison] = useState<OptimizationComparison | null>(null);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [interfaces, setInterfaces] = useState<Array<{ name: string; label?: string; address?: string; isUp: boolean }>>([]);
  const [tsharkInstalled, setTsharkInstalled] = useState<boolean>(false);
  const [tsharkPath, setTsharkPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Busca dados completos do sistema
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, historyRes, compRes, rulesRes, ifacesRes, logsRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()),
        fetch('/api/metrics/history').then((r) => r.json()),
        fetch('/api/optimizer/comparison').then((r) => r.json()),
        fetch('/api/rules').then((r) => r.json()),
        fetch('/api/interfaces').then((r) => r.json()),
        fetch('/api/logs?limit=120').then((r) => r.json()),
      ]);

      if (statusRes.success) setStatus(statusRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      if (compRes.success) setComparison(compRes.data);
      if (rulesRes.success) setRules(rulesRes.data);
      if (ifacesRes.success) {
        setInterfaces(ifacesRes.data.interfaces || []);
        setTsharkInstalled(ifacesRes.data.tsharkInstalled || false);
        setTsharkPath(ifacesRes.data.tsharkPath || null);
      }
      if (logsRes.success) setLogs(logsRes.data);
    } catch {
      // Falhas silenciosas de polling para não interromper navegação
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));

    // Polling contínuo a cada 2.5s para atualização dos gráficos e status
    const interval = setInterval(() => {
      fetchData();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Ações da API
  const handleStartCapture = async (iface: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/capture/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkInterface: iface }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao iniciar captura.');
      showToast('success', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopCapture = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/capture/stop', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao parar captura.');
      showToast('info', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCustomTsharkPath = async (customPath: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interfaces/tshark-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPath }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao localizar TShark no caminho informado.');
      showToast('success', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSimulation = async (scenario: ThreatScenario) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao iniciar simulação.');
      showToast('success', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulate/stop', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao parar simulação.');
      showToast('info', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao alternar regra de proteção.');
      setStatus(json.data);
      showToast('success', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRuleSet = async (ruleIds: string[], source: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rules/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIds, source }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao aplicar lote de regras.');
      setStatus(json.data);
      showToast('success', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoProtect = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rules/auto-protect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao configurar proteção automática.');
      setStatus(json.data);
      showToast('info', json.message);
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOptimization = async (maxCpu: number, maxFp: number, seed: number) => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimizer/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCpu, maxFp, seed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao executar otimização.');
      setComparison(json.data);
      showToast('success', 'Otimização BGA (Algoritmo Genético) executada e sincronizada com o motor IPS.');
      fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : String(err));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
      showToast('info', 'Buffer de logs limpo com sucesso.');
    } catch {
      showToast('error', 'Falha ao limpar logs.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-xl text-xs backdrop-blur-md transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-700 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
            <span className="flex-1 font-mono">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-400 hover:text-zinc-200 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <Header status={status} onRefresh={fetchData} isLoading={isLoading} />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Grid: Risk Gauge & Temporal Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <RiskGaugeCard status={status} />
          </div>
          <div className="lg:col-span-2">
            <TemporalCharts history={history} currentRiskScore={status?.riskScore ?? 15} />
          </div>
        </div>

        {/* Middle Section: BGA Defense Optimizer */}
        <OptimizerComparisonCard
          comparison={comparison}
          onRunOptimization={handleRunOptimization}
          isOptimizing={isOptimizing}
        />

        {/* Rules Catalog & Active IPS Enforcement */}
        <RuleCatalogCard
          rules={rules}
          selectedBgaRuleIds={comparison?.bgaResult.selectedRuleIds ?? []}
          enforcedRuleIds={status?.enforcedRuleIds ?? []}
          autoProtectEnabled={status?.autoProtectEnabled ?? true}
          mitigatedPacketsTotal={status?.mitigatedPacketsTotal ?? 0}
          onToggleRule={handleToggleRule}
          onApplyRuleSet={handleApplyRuleSet}
          onToggleAutoProtect={handleToggleAutoProtect}
          isLoading={isLoading}
        />

        {/* Operational Control Deck */}
        <ControlDeck
          status={status}
          interfaces={interfaces}
          tsharkInstalled={tsharkInstalled}
          tsharkPath={tsharkPath}
          onStartCapture={handleStartCapture}
          onStopCapture={handleStopCapture}
          onStartSimulation={handleStartSimulation}
          onStopSimulation={handleStopSimulation}
          onRefreshInterfaces={fetchData}
          onSetCustomTsharkPath={handleSetCustomTsharkPath}
          isLoading={isLoading}
        />

        {/* Real-Time Audit Terminal */}
        <AuditTerminal logs={logs} onClearLogs={handleClearLogs} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        NetLogix Wi-Fi IDS/IPS — Monitoramento de Rede, Inferência Fuzzy Mamdani & Proteção Ativa Automatizada por BGA.
      </footer>
    </div>
  );
}
