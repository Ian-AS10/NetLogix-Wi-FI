/**
 * @file AuditTerminal.tsx
 * Terminal NOC de auditoria e telemetria de eventos em tempo real.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Trash2, ArrowDownCircle, ShieldAlert } from 'lucide-react';
import { LogEntry, LogLevel } from '../utils/logger.js';

interface AuditTerminalProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const AuditTerminal: React.FC<AuditTerminalProps> = ({ logs, onClearLogs }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === 'ALL') return true;
    return log.level === levelFilter;
  });

  const getLevelStyle = (level: LogLevel) => {
    switch (level) {
      case 'SECURITY':
        return 'text-purple-400 font-bold';
      case 'ERROR':
        return 'text-rose-400 font-bold';
      case 'WARN':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl font-mono text-xs flex flex-col">
      {/* Terminal Title Bar */}
      <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200 uppercase tracking-wide">
            Console de Auditoria & Eventos do IDS
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {logs.length} eventos
          </span>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-2 py-0.5 text-[11px] focus:outline-none"
          >
            <option value="ALL">Todos os Níveis</option>
            <option value="SECURITY">Apenas Segurança</option>
            <option value="ERROR">Apenas Erros</option>
            <option value="WARN">Avisos</option>
            <option value="INFO">Informativos</option>
          </select>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title="Alternar rolagem automática"
            className={`p-1 rounded border transition ${
              autoScroll
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/60'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            title="Limpar buffer de logs"
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalContainerRef}
        className="p-3 bg-zinc-950 h-56 overflow-y-auto space-y-1 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic py-8 text-center">
            Nenhum registro de log para o filtro selecionado.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.epochMs).toLocaleTimeString('pt-BR', { hour12: false });
            return (
              <div key={log.id} className="leading-relaxed hover:bg-zinc-900/60 px-1 rounded flex items-start gap-2">
                <span className="text-zinc-500 shrink-0 select-none">[{timeStr}]</span>
                <span className={`shrink-0 ${getLevelStyle(log.level)}`}>[{log.level}]</span>
                <span className="text-zinc-400 shrink-0">[{log.source}]:</span>
                <span className="text-zinc-200 break-words">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
