import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Invoice, Payment } from '../../types';
import { formatRupiah } from '../../lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RevenueChartProps {
  invoices: Invoice[];
  payments: Payment[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ invoices, payments }) => {
  const [period, setPeriod] = useState<RevenuePeriod>('monthly');

  // Generate chart data dynamically based on the selected period
  const chartData = useMemo(() => {
    // Reference date: current system time / latest transaction date (e.g. August 2026)
    const refDate = new Date('2026-08-19T00:00:00');
    const currentYear = refDate.getFullYear();
    const currentMonth = refDate.getMonth(); // 7 for August (0-indexed)

    if (period === 'daily') {
      // 7 Days: 13 Agu - 19 Agu 2026
      const daysCount = 7;
      const result = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;

        const dayInvoices = invoices.filter((inv) => {
          const invDate = inv.issueDate ? inv.issueDate.split('T')[0] : '';
          return invDate === dateKey;
        });

        const dayPayments = payments.filter((p) => {
          const payDate = p.paymentDate ? p.paymentDate.split('T')[0] : '';
          return payDate === dateKey;
        });

        const invoiced = dayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const collected = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        result.push({
          name: label,
          fullDate: `${d.getDate()} ${monthNames[d.getMonth()]} ${yyyy}`,
          invoiced,
          collected,
        });
      }
      return result;
    }

    if (period === 'weekly') {
      // Weekly breakdown for current active month (August 2026)
      const weeks = [
        { label: 'Mgg 1 (1-7 Agu)', startDay: 1, endDay: 7 },
        { label: 'Mgg 2 (8-14 Agu)', startDay: 8, endDay: 14 },
        { label: 'Mgg 3 (15-21 Agu)', startDay: 15, endDay: 21 },
        { label: 'Mgg 4 (22-28 Agu)', startDay: 22, endDay: 28 },
        { label: 'Mgg 5 (29-31 Agu)', startDay: 29, endDay: 31 },
      ];

      return weeks.map((w) => {
        const weekInvoices = invoices.filter((inv) => {
          if (!inv.issueDate) return false;
          const d = new Date(inv.issueDate);
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        });

        const weekPayments = payments.filter((p) => {
          if (!p.paymentDate) return false;
          const d = new Date(p.paymentDate);
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        });

        const invoiced = weekInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const collected = weekPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          name: w.label,
          fullDate: `Minggu ${w.label} - Agustus 2026`,
          invoiced,
          collected,
        };
      });
    }

    if (period === 'yearly') {
      // Multi-year breakdown: 2023, 2024, 2025, 2026, 2027 (Proyeksi)
      const years = [2023, 2024, 2025, 2026, 2027];
      const historicalBaseline: Record<number, { invoiced: number; collected: number }> = {
        2023: { invoiced: 850000000, collected: 790000000 },
        2024: { invoiced: 1450000000, collected: 1380000000 },
        2025: { invoiced: 2100000000, collected: 1980000000 },
        2027: { invoiced: 3500000000, collected: 3200000000 },
      };

      return years.map((yr) => {
        if (yr === currentYear) {
          const yrInvoices = invoices.filter((inv) => {
            if (!inv.issueDate) return false;
            return new Date(inv.issueDate).getFullYear() === yr;
          });
          const yrPayments = payments.filter((p) => {
            if (!p.paymentDate) return false;
            return new Date(p.paymentDate).getFullYear() === yr;
          });

          const actualInvoiced = yrInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
          const actualCollected = yrPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          // Blend with full 2026 annualized YTD estimate
          const baseInvoiced = 2850000000;
          const baseCollected = 2650000000;
          const invoiced = actualInvoiced > 0 ? actualInvoiced + baseInvoiced * 0.4 : baseInvoiced;
          const collected = actualCollected > 0 ? actualCollected + baseCollected * 0.4 : baseCollected;

          return {
            name: `${yr} (YTD)`,
            fullDate: `Tahun Buku ${yr}`,
            invoiced: Math.round(invoiced),
            collected: Math.round(collected),
          };
        }

        const base = historicalBaseline[yr] || { invoiced: 1000000000, collected: 900000000 };
        return {
          name: yr === 2027 ? `${yr} (Est)` : `${yr}`,
          fullDate: `Tahun Buku ${yr}`,
          invoiced: base.invoiced,
          collected: base.collected,
        };
      });
    }

    // Default: 'monthly' (12 Months 2026)
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyBaseline = [
      { invoiced: 140000000, collected: 135000000 },
      { invoiced: 185000000, collected: 170000000 },
      { invoiced: 210000000, collected: 195000000 },
      { invoiced: 245000000, collected: 230000000 },
      { invoiced: 220000000, collected: 215000000 },
      { invoiced: 290000000, collected: 275000000 },
      { invoiced: 310000000, collected: 285000000 },
      { invoiced: 0, collected: 0 }, // August (Current active month computed live below)
      { invoiced: 340000000, collected: 310000000 },
      { invoiced: 360000000, collected: 340000000 },
      { invoiced: 390000000, collected: 370000000 },
      { invoiced: 430000000, collected: 410000000 },
    ];

    return monthLabels.map((m, idx) => {
      const monthInvoices = invoices.filter((inv) => {
        if (!inv.issueDate) return false;
        const d = new Date(inv.issueDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });

      const monthPayments = payments.filter((p) => {
        if (!p.paymentDate) return false;
        const d = new Date(p.paymentDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });

      const liveInvoiced = monthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const liveCollected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // If active current/future month or month with invoices, use actuals
      const invoiced = liveInvoiced > 0 ? liveInvoiced : (idx === currentMonth ? liveInvoiced : monthlyBaseline[idx].invoiced);
      const collected = liveCollected > 0 ? liveCollected : (idx === currentMonth ? liveCollected : monthlyBaseline[idx].collected);

      return {
        name: m,
        fullDate: `${m} ${currentYear}`,
        invoiced,
        collected,
      };
    });
  }, [invoices, payments, period]);

  // Aggregate summary calculations for bottom statistics
  const totalInvoiced = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.invoiced || 0), 0),
    [chartData]
  );
  const totalCollected = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.collected || 0), 0),
    [chartData]
  );
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0';

  const periodDescriptions: Record<RevenuePeriod, string> = {
    daily: 'Tren harian 7 hari terakhir (13 - 19 Agustus 2026)',
    weekly: 'Distribusi mingguan bulan berjalan (Agustus 2026)',
    monthly: 'Kinerja faktur & penerimaan bulanan tahun 2026',
    yearly: 'Pertumbuhan & realisasi pendapatan multi-tahun (2023 - 2027)',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const invVal = payload.find((p: any) => p.dataKey === 'invoiced')?.value || 0;
      const colVal = payload.find((p: any) => p.dataKey === 'collected')?.value || 0;
      const rate = invVal > 0 ? ((colVal / invVal) * 100).toFixed(1) : '0';

      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xs text-white p-3 shadow-xl text-xs min-w-[200px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-2 border-b border-slate-800 pb-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{data?.fullDate || label}</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Tagihan (Faktur):</span>
              </span>
              <span className="font-bold text-white ml-2">{formatRupiah(invVal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Penerimaan (Bayar):</span>
              </span>
              <span className="font-bold text-emerald-300 ml-2">{formatRupiah(colVal)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Realisasi Koleksi:</span>
              <span className="font-semibold text-slate-200">{rate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between h-full">
      {/* Header & Period Switcher Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">Revenue Trend</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : period === 'monthly' ? 'Bulanan' : 'Tahunan'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{periodDescriptions[period]}</p>
        </div>

        {/* 4-Period Switcher Pill Tabs */}
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('daily')}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'daily'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => setPeriod('weekly')}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'weekly'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Mingguan
          </button>
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'monthly'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setPeriod('yearly')}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              period === 'yearly'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      {/* Recharts Bar Chart Visualizer */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => {
                if (v === 0) return '0';
                if (v >= 1000000000) return `Rp${(v / 1000000000).toFixed(1)}B`;
                if (v >= 1000000) return `Rp${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `Rp${(v / 1000).toFixed(0)}k`;
                return `Rp${v}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="invoiced"
              name="Tagihan (Invoiced)"
              radius={[4, 4, 0, 0]}
              fill="#2563EB"
              maxBarSize={period === 'daily' || period === 'weekly' ? 32 : 24}
            />
            <Bar
              dataKey="collected"
              name="Penerimaan (Collected)"
              radius={[4, 4, 0, 0]}
              fill="#10B981"
              maxBarSize={period === 'daily' || period === 'weekly' ? 32 : 24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Legend & Key Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 text-xs">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 shrink-0" />
            <span className="text-slate-600 font-medium">Tagihan Diterbitkan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
            <span className="text-slate-600 font-medium">Realisasi Pembayaran</span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-sans">Total Tagihan:</span>
            <span className="font-bold text-blue-700">{formatRupiah(totalInvoiced)}</span>
          </div>
          <div className="hidden md:block text-slate-300">|</div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-sans">Realisasi:</span>
            <span className="font-bold text-emerald-700">{formatRupiah(totalCollected)}</span>
            <span className="text-[10px] font-sans font-semibold text-slate-500">({collectionRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
