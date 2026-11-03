/**
 * @file ControlDeck.tsx
 * Painel de controle operacional do IDS: captura TShark, simulação de ataques e injeção de métricas.
 */

import React, { useState } from 'react';
import { Terminal, Play, Square, Wifi, AlertTriangle, Send, RefreshCw, Cpu } from 'lucide-react';
import { SystemStatus, ThreatScenario } from '../domain/metrics.js';

interface ControlDeckProps {
  status: SystemStatus | null;
  interfaces: Array<{ name: string; address?: string; isUp: boolean }>;
  tsharkInstalled: boolean;
  onStartCapture: (iface: string) => void;
  onStopCapture: () => void;
  onStartSimulation: (scenario: ThreatScenario) => void;
  onStopSimulation: () => void;
  onInjectMetrics: (trafficRate: number, anomalyRate: number, newMacs: number) => void;
  onRefreshInterfaces: () => void;
  isLoading: boolean;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  status,
  interfaces,
  tsharkInstalled,
  onStartCapture,
  onStopCapture,
  onStartSimulation,
  onStopSimulation,
  onInjectMetrics,
  onRefreshInterfaces,
  isLoading,
}) => {
  const [selectedIface, setSelectedIface] = useState<string>(
    interfaces[0]?.name || status?.selectedInterface || 'wlan0'
  );
  const [manualTraffic, setManualTraffic] = useState<number>(1200);
  const [manualAnomaly, setManualAnomaly] = useState<number>(45);
  const [manualMacs, setManualMacs] = useState<number>(12);

  const isRealCapturing = status?.mode === 'real_capture';
  const isSimulating = status?.mode === 'simulated';

  const handleManualInject = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectMetrics(manualTraffic, manualAnomaly, manualMacs);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <Terminal className="h-5 w-5 text-emerald-400" />
        <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase font-mono">
          Centro de Operações e Testes
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Captura Real TShark */}
        <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-emerald-400" />
                1. Captura Passiva TShark
              </h3>
              <button
                type="button"
                onClick={onRefreshInterfaces}
                title="Recarregar interfaces"
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {!tsharkInstalled && (
              <div className="bg-amber-950/30 border border-amber-800/50 rounded p-2 text-[11px] text-amber-300 mb-2">
                <div className="flex items-center gap-1 font-semibold mb-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> TShark ausente no host
                </div>
                Use o Modo Simulado abaixo ou instale: <code className="bg-zinc-900 px-1 py-0.5 rounded text-[10px]">sudo apt install tshark</code>
              </div>
            )}

            <label className="block text-[11px] text-zinc-400 font-mono mb-1">Interface de Rede</label>
            <select
              value={selectedIface}
              onChange={(e) => setSelectedIface(e.target.value)}
              disabled={isRealCapturing || isSimulating || !tsharkInstalled}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono mb-3 disabled:opacity-50"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} {iface.address ? `(${iface.address})` : ''}
                </option>
              ))}
              {interfaces.length === 0 && <option value="wlan0">wlan0 (Padrão)</option>}
            </select>
          </div>

          <div className="flex gap-2">
            {!isRealCapturing ? (
              <button
                type="button"
                onClick={() => onStartCapture(selectedIface)}
                disabled={isLoading || isSimulating || !tsharkInstalled}
                className="w-full py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" /> Iniciar TShark
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopCapture}
                disabled={isLoading}
                className="w-full py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Square className="h-3.5 w-3.5" /> Parar Captura
              </button>
            )}
          </div>
        </div>

        {/* Column 2: Simulação de Cenários de Ataque */}
        <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
              <Cpu className="h-4 w-4 text-amber-400" />
              2. Simulação de Cenários
            </h3>
            <p className="text-[11px] text-zinc-400 mb-2">
              Injete padrões de tráfego sintéticos para avaliar o motor fuzzy e o BGA sem TShark.
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => onStartSimulation('normal')}
                disabled={isRealCapturing || isLoading}
                className={`p-2 rounded text-left border transition ${
                  status?.activeScenario === 'normal' && isSimulating
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                } disabled:opacity-50`}
              >
                Tráfego Normal
              </button>

              <button
                type="button"
                onClick={() => onStartSimulation('syn_flood')}
                disabled={isRealCapturing || isLoading}
                className={`p-2 rounded text-left border transition ${
                  status?.activeScenario === 'syn_flood' && isSimulating
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                } disabled:opacity-50`}
              >
                SYN Flood / DoS
              </button>

              <button
                type="button"
                onClick={() => onStartSimulation('deauth_burst')}
                disabled={isRealCapturing || isLoading}
                className={`p-2 rounded text-left border transition ${
                  status?.activeScenario === 'deauth_burst' && isSimulating
                    ? 'bg-rose-950/70 border-rose-500 text-rose-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                } disabled:opacity-50`}
              >
                802.11 Deauth
              </button>

              <button
                type="button"
                onClick={() => onStartSimulation('mac_spoofing')}
                disabled={isRealCapturing || isLoading}
                className={`p-2 rounded text-left border transition ${
                  status?.activeScenario === 'mac_spoofing' && isSimulating
                    ? 'bg-purple-950/70 border-purple-500 text-purple-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                } disabled:opacity-50`}
              >
                MAC Spoofing
              </button>
            </div>
          </div>

          {isSimulating && (
            <button
              type="button"
              onClick={onStopSimulation}
              disabled={isLoading}
              className="w-full py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs flex items-center justify-center gap-1.5 border border-zinc-700"
            >
              <Square className="h-3 w-3" /> Parar Simulação
            </button>
          )}
        </div>

        {/* Column 3: Injeção Manual de Métricas */}
        <form
          onSubmit={handleManualInject}
          className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 flex flex-col justify-between space-y-3"
        >
          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 mb-2">
              <Send className="h-4 w-4 text-sky-400" />
              3. Injeção Manual Pontual
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-zinc-400">Tráfego (pps)</label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={manualTraffic}
                  onChange={(e) => setManualTraffic(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400">Anomalias / Resets (eps)</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={manualAnomaly}
                  onChange={(e) => setManualAnomaly(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400">Novos MACs (qtd)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={manualMacs}
                  onChange={(e) => setManualMacs(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-1.5 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Injetar & Avaliar
          </button>
        </form>
      </div>
    </div>
  );
};
