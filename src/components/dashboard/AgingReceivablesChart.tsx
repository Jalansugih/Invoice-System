import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { AgingReceivableGroup } from '../../types';
import { formatRupiah } from '../../lib/utils';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface AgingReceivablesChartProps {
  agingData: AgingReceivableGroup[];
}

interface RangeConfig {
  color: string;
  dotColor: string;
  barColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

const RANGE_CONFIGS: Record<string, RangeConfig> = {
  'Belum Jatuh Tempo': {
    color: '#3B82F6', // Blue 500
    dotColor: 'bg-blue-500',
    barColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    description: 'Tagihan aktif normal',
  },
  '1 - 30 Hari': {
    color: '#10B981', // Emerald 500
    dotColor: 'bg-emerald-500',
    barColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    description: 'Lewat tempo 1-30 hari',
  },
  '31 - 60 Hari': {
    color: '#F59E0B', // Amber 500
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    description: 'Lewat tempo 31-60 hari',
  },
  '61 - 90 Hari': {
    color: '#F97316', // Orange 500
    dotColor: 'bg-orange-500',
    barColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    description: 'Lewat tempo 61-90 hari',
  },
  '> 90 Hari': {
    color: '#EF4444', // Rose 500
    dotColor: 'bg-rose-500',
    barColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    description: 'Kritis (> 90 hari)',
  },
};

export const AgingReceivablesChart: React.FC<AgingReceivablesChartProps> = ({ agingData }) => {
  const totalAmount = agingData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalInvoices = agingData.reduce((sum, item) => sum + (item.count || 0), 0);

  const overdueItems = agingData.filter((a) => a.range !== 'Belum Jatuh Tempo');
  const totalOverdueAmount = overdueItems.reduce((sum, a) => sum + a.amount, 0);
  const totalOverdueCount = overdueItems.reduce((sum, a) => sum + a.count, 0);

  const overduePercentage = totalAmount > 0 ? (totalOverdueAmount / totalAmount) * 100 : 0;

  // Prepare chart dataset
  const isAllZero = totalAmount === 0;
  const chartData = isAllZero
    ? [{ range: 'Tidak Ada Tagihan', amount: 1, count: 0, percentage: 100, color: '#E2E8F0' }]
    : agingData
        .filter((item) => item.amount > 0)
        .map((item) => ({
          ...item,
          color: RANGE_CONFIGS[item.range]?.color || '#64748B',
        }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (isAllZero) {
        return (
          <div className="rounded-lg border border-slate-700 bg-slate-900 text-white p-2 text-xs shadow-lg">
            <p className="text-slate-300">Tidak ada piutang aktif</p>
          </div>
        );
      }

      const cfg = RANGE_CONFIGS[data.range];
      const pct = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : '0';

      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xs text-white p-2.5 shadow-xl text-xs min-w-[170px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <div>
              <p className="font-bold text-slate-100">{data.range}</p>
              {cfg && <p className="text-[10px] text-slate-400">{cfg.description}</p>}
            </div>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nominal:</span>
              <span className="font-bold text-white ml-2">{formatRupiah(data.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Jumlah Faktur:</span>
              <span className="font-semibold text-slate-200 ml-2">{data.count} Dok</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Porsi:</span>
              <span className="font-bold text-blue-400">{pct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
      {/* Header with Title and Overdue Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Analisis Umur Piutang</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribusi portofolio piutang usaha (Aging)</p>
            </div>
          </div>

          {totalOverdueCount > 0 ? (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold shrink-0 font-mono">
              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{totalOverdueCount} Overdue</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Portofolio Sehat</span>
            </div>
          )}
        </div>

        {/* Donut Chart Visualizer with Proportionate Sizing */}
        <div className="relative w-full h-40 flex items-center justify-center my-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="range"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={isAllZero ? 0 : 3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Total Piutang
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono tracking-tight leading-tight mt-0.5">
              {formatRupiah(totalAmount)}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              {totalInvoices} Dokumen
            </span>
          </div>
        </div>
      </div>

      {/* Structured Aging Breakdown List */}
      <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
        {agingData.map((item) => {
          const cfg = RANGE_CONFIGS[item.range] || {
            color: '#64748B',
            dotColor: 'bg-slate-400',
            barColor: 'bg-slate-400',
            badgeBg: 'bg-slate-50',
            badgeText: 'text-slate-700',
            description: '',
          };

          const pctNumber = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
          const pctFormatted = pctNumber.toFixed(1);
          const hasAmount = item.amount > 0;

          return (
            <div
              key={item.range}
              className="py-1 px-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Row: Label, Doc Count, Nominal, Percentage */}
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span
                    className={`text-[11px] truncate ${
                      hasAmount ? 'font-medium text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {item.range}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    ({item.count})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-xs ${
                      hasAmount ? 'font-bold text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {formatRupiah(item.amount)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                    {pctFormatted}%
                  </span>
                </div>
              </div>

              {/* Proportion Bar */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${cfg.barColor}`}
                  style={{ width: `${Math.max(pctNumber, hasAmount ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Status Portofolio:</span>
        {overduePercentage > 0 ? (
          <span className="font-semibold text-rose-600 font-mono">
            {overduePercentage.toFixed(1)}% Terlambat ({formatRupiah(totalOverdueAmount)})
          </span>
        ) : (
          <span className="font-semibold text-emerald-600">100% Pembayaran Lancar</span>
        )}
      </div>
    </div>
  );
};
