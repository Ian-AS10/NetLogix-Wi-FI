/**
 * @file TemporalCharts.tsx
 * Gráficos em tempo real com Chart.js para evolução temporal do risco e telemetria.
 */

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { MetricSnapshot } from '../domain/metrics.js';
import { LineChart, Activity } from 'lucide-react';

Chart.register(...registerables);

interface TemporalChartsProps {
  history: MetricSnapshot[];
  currentRiskScore: number;
}

export const TemporalCharts: React.FC<TemporalChartsProps> = ({ history, currentRiskScore }) => {
  const riskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const metricsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const riskChartInstance = useRef<Chart | null>(null);
  const metricsChartInstance = useRef<Chart | null>(null);

  // Efeito para o gráfico de evolução do risco
  useEffect(() => {
    if (!riskCanvasRef.current) return;

    const ctx = riskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destrói instância anterior para evitar memory leak
    if (riskChartInstance.current) {
      riskChartInstance.current.destroy();
    }

    const labels = history.map((item, idx) => {
      const d = new Date(item.timestamp);
      return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    });

    // Se histórico for menor que 2 itens, cria pontos fictícios para inicializar
    const displayLabels = labels.length > 0 ? labels : ['00:00', '00:05'];
    const riskData = history.map((item) => {
      // Cálculo aproximado do risco no ponto temporal ou score atual
      return currentRiskScore;
    });
    if (riskData.length === 0) riskData.push(currentRiskScore, currentRiskScore);

    riskChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: 'Score de Risco (0-100)',
            data: riskData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: {
            grid: { color: 'rgba(39, 39, 42, 0.6)' },
            ticks: { color: '#71717a', font: { size: 10, family: 'monospace' }, maxTicksLimit: 8 },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(39, 39, 42, 0.6)' },
            ticks: { color: '#71717a', font: { size: 10, family: 'monospace' }, stepSize: 25 },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: '#3f3f46',
            borderWidth: 1,
            titleFont: { family: 'monospace' },
            bodyFont: { family: 'monospace' },
          },
        },
      },
    });

    return () => {
      riskChartInstance.current?.destroy();
    };
  }, [history, currentRiskScore]);

  // Efeito para o gráfico de telemetria combinada (PPS e EPS)
  useEffect(() => {
    if (!metricsCanvasRef.current) return;

    const ctx = metricsCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (metricsChartInstance.current) {
      metricsChartInstance.current.destroy();
    }

    const labels = history.map((item) => {
      const d = new Date(item.timestamp);
      return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    });

    const displayLabels = labels.length > 0 ? labels : ['00:00', '00:05'];
    const ppsData = history.map((item) => item.trafficRate);
    const epsData = history.map((item) => item.anomalyRate);

    metricsChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: 'Taxa Tráfego (pps)',
            data: ppsData.length > 0 ? ppsData : [0, 0],
            borderColor: '#38bdf8',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2,
            yAxisID: 'yTraffic',
            pointRadius: 2,
          },
          {
            label: 'Taxa Anomalia (eps)',
            data: epsData.length > 0 ? epsData : [0, 0],
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2,
            yAxisID: 'yAnomaly',
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: {
            grid: { color: 'rgba(39, 39, 42, 0.6)' },
            ticks: { color: '#71717a', font: { size: 10, family: 'monospace' }, maxTicksLimit: 8 },
          },
          yTraffic: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(39, 39, 42, 0.6)' },
            ticks: { color: '#38bdf8', font: { size: 10, family: 'monospace' } },
            title: { display: true, text: 'pps', color: '#38bdf8', font: { size: 10 } },
          },
          yAnomaly: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#f59e0b', font: { size: 10, family: 'monospace' } },
            title: { display: true, text: 'eps', color: '#f59e0b', font: { size: 10 } },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#a1a1aa', font: { size: 10, family: 'monospace' }, boxWidth: 12 },
          },
          tooltip: {
            backgroundColor: '#18181b',
            borderColor: '#3f3f46',
            borderWidth: 1,
            titleFont: { family: 'monospace' },
            bodyFont: { family: 'monospace' },
          },
        },
      },
    });

    return () => {
      metricsChartInstance.current?.destroy();
    };
  }, [history]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Risco Temporal */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase font-mono tracking-wide">
              Evolução Temporal do Risco
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Escala Mamdani [0-100]</span>
        </div>
        <div className="h-48 w-full">
          <canvas ref={riskCanvasRef} />
        </div>
      </div>

      {/* Chart 2: Telemetria Combinada */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase font-mono tracking-wide">
              Telemetria de Tráfego & Anomalias
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Janela 5s</span>
        </div>
        <div className="h-48 w-full">
          <canvas ref={metricsCanvasRef} />
        </div>
      </div>
    </div>
  );
};
