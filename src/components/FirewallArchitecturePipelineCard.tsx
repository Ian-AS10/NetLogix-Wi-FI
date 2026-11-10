/**
 * @file FirewallArchitecturePipelineCard.tsx
 * Arquitetura Híbrida do Firewall Inteligente NetLogix (Opção 1)
 * Estrutura idêntica à especificação de arquitetura:
 *  - Passo A: Avaliação Difusa do Risco (Fuzzy Mamdani) [≤ 40% Seguro]
 *  - Passo B: Otimização via Algoritmo Genético (BGA) [Teto 40% CPU / Knapsack]
 *  - Passo C: Execução Física no Firewall (PowerShell) [New-NetFirewallRule ...]
 *  - 4. Expurgo Autônomo (Rollback) & Limiar de Risco (40%) [Remove-NetFirewallRule ...]
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Zap,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { SystemStatus } from '../domain/metrics.js';

interface FirewallArchitecturePipelineCardProps {
  status: SystemStatus | null;
  onPurgeRules?: () => void;
  isLoading?: boolean;
}

export const FirewallArchitecturePipelineCard: React.FC<FirewallArchitecturePipelineCardProps> = ({
  status,
  onPurgeRules,
  isLoading = false,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const riskScore = status?.riskScore ?? 15;
  const isSafe = riskScore <= 40;
  const enforcedCount = status?.enforcedRuleIds?.length ?? 0;
  const hasAdmin = status?.hasAdminPrivileges;
  const lastAction = status?.lastFirewallAction ?? 'IDLE';

  const copyToClipboard = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const applyCmd =
    'New-NetFirewallRule -DisplayName "NetLogix_AutoBlock_1" -Direction Inbound -Action Block -Protocol TCP -LocalPort 80,443';
  const purgeCmd = 'Remove-NetFirewallRule -DisplayName "NetLogix_AutoBlock_*"';

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col gap-5 text-zinc-100">
      {/* Top Banner / Status Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-sky-950/80 border border-sky-500/50 text-sky-400">
              <Zap className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold tracking-wide uppercase font-mono text-zinc-100">
              Arquitetura de Defesa e Firewall em Camadas (Opção 1)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-600/50">
              PIPELINE HÍBRIDO INTELIGENTE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Integração ponta a ponta: Inferência Mamdani, Otimizador Knapsack BGA (Teto 40% CPU) e Execução Física via PowerShell no Windows Defender Firewall.
          </p>
        </div>

        {/* Operating Mode & Admin Privileges indicator */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 text-[11px] ${
              hasAdmin
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                : 'bg-zinc-800/90 text-zinc-300 border-zinc-700'
            }`}
            title="Verificação de elevação: Se rodar sem privilégio de Administrador, opera em Modo Analítico Seguro sem quebrar o sistema"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                hasAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {hasAdmin
                ? 'UAC: ADMINISTRADOR (EXECUÇÃO REAL ATIVA)'
                : 'UAC: MODO RESILIENTE HÍBRIDO (SEM ERRO FATAL)'}
            </span>
          </div>

          {onPurgeRules && (
            <button
              type="button"
              disabled={isLoading || enforcedCount === 0}
              onClick={onPurgeRules}
              className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-zinc-800 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-200 border border-zinc-700 hover:border-rose-600/50 transition flex items-center gap-1 disabled:opacity-40"
              title="Executa imediatamente o comando Remove-NetFirewallRule via PowerShell"
            >
              <RotateCcw className="h-3 w-3" />
              Forçar Expurgo (Rollback)
            </button>
          )}
        </div>
      </div>

      {/* Passo A, B, C Cards - Exactly matching user's architecture screenshot */}
      <div className="flex flex-col gap-3">
        {/* Passo A */}
        <div
          className={`p-4 rounded-r-lg border-l-4 transition-all duration-300 ${
            isSafe
              ? 'bg-sky-950/20 border-l-sky-500 border-y border-r border-sky-900/40'
              : 'bg-amber-950/20 border-l-amber-500 border-y border-r border-amber-900/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-xs sm:text-sm font-bold text-sky-300 font-mono flex items-center gap-1.5">
              <span>Passo A — Avaliação Difusa do Risco (Fuzzy Mamdani):</span>
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                isSafe
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
            >
              Score Atual: {riskScore.toFixed(1)}% ({isSafe ? 'SEGURO ≤ 40%' : 'AMEAÇA > 40%'})
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            O <strong>FuzzyEngine</strong> junta as 3 métricas da janela e gera um Score de Risco (0% a 100%). Se o risco for <strong>≤ 40%</strong>, o tráfego é considerado seguro e <strong>nenhuma regra é aplicada</strong>.
          </p>
        </div>

        {/* Passo B */}
        <div
          className={`p-4 rounded-r-lg border-l-4 transition-all duration-300 ${
            !isSafe
              ? 'bg-purple-950/25 border-l-purple-500 border-y border-r border-purple-900/40'
              : 'bg-zinc-900/40 border-l-sky-500/70 border-y border-r border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-xs sm:text-sm font-bold text-sky-300 font-mono flex items-center gap-1.5">
              <span>Passo B — Otimização via Algoritmo Genético (BGA):</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-purple-300 border border-purple-700/40 flex items-center gap-1">
              <Cpu className="h-3 w-3" /> Teto de CPU: 40% (Knapsack)
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Se o <strong>Risco &gt; 40%</strong>, o <strong>BGAOptimizer</strong> é acionado. Ele escolhe a melhor combinação de regras do catálogo que maximize a mitigação sem ultrapassar o limite estipulado de <strong>40% de consumo de CPU</strong> (Knapsack Problem).
          </p>
        </div>

        {/* Passo C */}
        <div className="p-4 rounded-r-lg border-l-4 border-l-emerald-500 border-y border-r border-emerald-950/60 bg-emerald-950/15">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-emerald-300 font-mono flex items-center gap-1.5">
              <span>Passo C — Execução Física no Firewall (PowerShell):</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">
              Status Firewall: {enforcedCount > 0 ? `${enforcedCount} REGRAS EM EXECUÇÃO` : 'EXPURGADO (STANDBY)'}
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mb-2">
            O <strong>FirewallManager</strong> recebe as regras do BGA e executa comandos PowerShell no SO para criar bloqueios reais no <strong>Windows Defender Firewall</strong>:
          </p>

          {/* PowerShell Code Box */}
          <div className="bg-[#0b1329] border border-blue-900/60 rounded-md p-2.5 font-mono text-xs flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto text-sky-400">
              <Terminal className="h-4 w-4 shrink-0 text-sky-500" />
              <code className="text-[11px] sm:text-xs text-sky-300 select-all whitespace-nowrap">
                {applyCmd}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(applyCmd, 'apply')}
              className="p-1 rounded bg-blue-950 hover:bg-blue-900 text-sky-300 border border-blue-700/60 transition shrink-0"
              title="Copiar comando PowerShell"
            >
              {copiedCmd === 'apply' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. EXPURGO AUTÔNOMO (ROLLBACK) & LIMIAR DE RISCO (40%) */}
      <div className="pt-2 flex flex-col gap-3">
        <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-zinc-100 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-sky-400" />
          <span>4. EXPURGO AUTÔNOMO (ROLLBACK) &amp; LIMIAR DE RISCO (40%)</span>
        </h3>

        {/* Why 40% Threshold Box */}
        <div className="p-4 rounded-r-lg border-l-4 border-l-sky-500 border-y border-r border-sky-950/60 bg-sky-950/15">
          <h4 className="text-xs sm:text-sm font-semibold text-sky-300 font-mono mb-2">
            Por que o Limiar Seguro e o Limite de CPU são definidos em 40%?
          </h4>
          <ol className="text-xs text-zinc-300 space-y-2 list-none">
            <li className="flex items-start gap-2">
              <span className="font-bold text-sky-400 shrink-0 font-mono">1.</span>
              <div>
                <strong>Absorção de Ruído:</strong> Em redes Wi-Fi, picos momentâneos de pacotes acontecem ao carregar vídeos ou abrir abas. O limiar de <strong>40%</strong> impede que o firewall bloqueie a rede por flutuações normais (<strong>evita flapping</strong>).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-sky-400 shrink-0 font-mono">2.</span>
              <div>
                <strong>Reserva de Hardware:</strong> No BGA, o limite de <strong>40% de CPU</strong> garante que <strong>60% do processamento</strong> fique livre para a máquina continuar roteando e operando sem travar.
              </div>
            </li>
          </ol>
        </div>

        {/* Autonomous Rollback Mechanism Box */}
        <div className="p-4 rounded-xl border border-sky-900/50 bg-[#07111e]/90 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-100 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Mecanismo Autônomo de Expurgo (Rollback)</span>
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
              Última Ação: {lastAction === 'PURGED' ? 'EXPURGADO / LIMPO' : lastAction === 'APPLIED' ? 'BLOQUEIOS ATIVOS' : 'EM ESPERA'}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Assim que o ataque cessa e a leitura do TShark indica que o Score de Risco caiu para <strong>≤ 40%</strong>, o <strong>IDSEngine</strong> executa automaticamente a limpeza de bloqueios no SO via PowerShell:
          </p>

          {/* PowerShell Rollback Code Box */}
          <div className="bg-[#0b1329] border border-blue-900/60 rounded-md p-2.5 font-mono text-xs flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto text-sky-400">
              <Terminal className="h-4 w-4 shrink-0 text-sky-500" />
              <code className="text-[11px] sm:text-xs text-sky-300 select-all whitespace-nowrap">
                {purgeCmd}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(purgeCmd, 'purge')}
              className="p-1 rounded bg-blue-950 hover:bg-blue-900 text-sky-300 border border-blue-700/60 transition shrink-0"
              title="Copiar comando PowerShell de Rollback"
            >
              {copiedCmd === 'purge' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Isso remove todas as regras criadas pelo NetLogix de uma só vez, restaurando o tráfego normal da rede sem necessidade de intervenção humana.
          </p>
        </div>
      </div>
    </div>
  );
};
