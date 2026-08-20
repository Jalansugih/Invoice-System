import React, { useState, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  BarChart3,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Hourglass,
  Receipt,
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'revenue' | 'aging' | 'cashflow' | 'tax'>('revenue');

  const invoices = StorageService.getInvoices();
  const payments = StorageService.getPayments();
  const customers = StorageService.getCustomers();
  const org = StorageService.getOrganization();

  // 1. Revenue report data
  const revenueSummary = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalSubtotal = invoices.reduce((sum, i) => sum + i.subtotal, 0);
    const totalDiscount = invoices.reduce((sum, i) => sum + i.discountAmount, 0);
    const totalTax = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    return {
      totalInvoiced,
      totalSubtotal,
      totalDiscount,
      totalTax,
      totalPaid,
      totalOutstanding,
      count: invoices.length,
    };
  }, [invoices]);

  // 2. Aging Piutang by Customer
  const customerAgingData = useMemo(() => {
    return customers
      .filter((c) => c.totalOutstanding > 0)
      .map((c) => {
        const custInvoices = invoices.filter((i) => i.customerId === c.id && i.outstandingAmount > 0);
        const today = new Date();

        let current = 0;
        let d1_30 = 0;
        let d31_60 = 0;
        let d61_90 = 0;
        let dOver90 = 0;

        custInvoices.forEach((inv) => {
          const due = new Date(inv.dueDate);
          const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) current += inv.outstandingAmount;
          else if (diffDays <= 30) d1_30 += inv.outstandingAmount;
          else if (diffDays <= 60) d31_60 += inv.outstandingAmount;
          else if (diffDays <= 90) d61_90 += inv.outstandingAmount;
          else dOver90 += inv.outstandingAmount;
        });

        return {
          id: c.id,
          name: c.name,
          companyName: c.companyName,
          totalOutstanding: c.totalOutstanding,
          current,
          d1_30,
          d31_60,
          d61_90,
          dOver90,
          invoiceCount: custInvoices.length,
        };
      });
  }, [customers, invoices]);

  // 3. Tax / PPN Recap
  const taxSummary = useMemo(() => {
    return invoices.map((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId);
      return {
        noInvoice: inv.invoiceNumber,
        tanggal: inv.issueDate,
        pelanggan: inv.customerName,
        npwp: cust?.npwp || '-',
        dpp: inv.subtotal - inv.discountAmount,
        tarifPpn: `${inv.taxRate}%`,
        ppn: inv.taxAmount,
        total: inv.grandTotal,
      };
    });
  }, [invoices, customers]);

  const totalDpp = taxSummary.reduce((sum, t) => sum + t.dpp, 0);
  const totalPpn = taxSummary.reduce((sum, t) => sum + t.ppn, 0);

  const handleExportCurrent = () => {
    if (activeReport === 'revenue') {
      const data = invoices.map((i) => ({
        'No. Faktur': i.invoiceNumber,
        'Tanggal Terbit': i.issueDate,
        'Jatuh Tempo': i.dueDate,
        'Pelanggan': i.customerName,
        'DPP Subtotal': i.subtotal,
        'Diskon': i.discountAmount,
        'PPN': i.taxAmount,
        'Grand Total': i.grandTotal,
        'Terbayar': i.paidAmount,
        'Sisa Piutang': i.outstandingAmount,
        'Status': i.status,
      }));
      exportToCSV(`Laporan_Pendapatan_Faktur_${new Date().toISOString().split('T')[0]}`, data);
    } else if (activeReport === 'aging') {
      const data = customerAgingData.map((a) => ({
        'Nama Pelanggan': a.name,
        'Perusahaan': a.companyName,
        'Belum Jatuh Tempo': a.current,
        '1 - 30 Hari': a.d1_30,
        '31 - 60 Hari': a.d31_60,
        '61 - 90 Hari': a.d61_90,
        '> 90 Hari (Macet)': a.dOver90,
        'Total Piutang': a.totalOutstanding,
      }));
      exportToCSV(`Laporan_Aging_Piutang_${new Date().toISOString().split('T')[0]}`, data);
    } else if (activeReport === 'cashflow') {
      const data = payments.map((p) => ({
        'No. Kuitansi': p.receiptNumber,
        'Tanggal Terima': p.paymentDate,
        'No. Invoice': p.invoiceNumber,
        'Pelanggan': p.customerName,
        'Metode Pembayaran': p.paymentMethod,
        'Nominal': p.amount,
        'No. Referensi': p.referenceNumber || '-',
      }));
      exportToCSV(`Laporan_Arus_Kas_Penerimaan_${new Date().toISOString().split('T')[0]}`, data);
    } else if (activeReport === 'tax') {
      const data = taxSummary.map((t) => ({
        'No. Invoice': t.noInvoice,
        'Tanggal': t.tanggal,
        'Nama Pembeli': t.pelanggan,
        'NPWP': t.npwp,
        'Dasar Pengenaan Pajak (DPP)': t.dpp,
        'Tarif': t.tarifPpn,
        'PPN Terutang': t.ppn,
        'Grand Total': t.total,
      }));
      exportToCSV(`Rekapitulasi_PPN_Keluaran_${new Date().toISOString().split('T')[0]}`, data);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Financial & Aging Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official tax recaps, aging schedule analysis, revenue recognition, and cash flow reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCurrent}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'revenue', label: 'Revenue & Invoices', icon: TrendingUp },
          { id: 'aging', label: 'Aging Receivables Schedule', icon: Hourglass },
          { id: 'cashflow', label: 'Cash Flow Receipts', icon: DollarSign },
          { id: 'tax', label: 'VAT / PPN Tax Recap', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`text-xs px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeReport === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Revenue Report */}
      {activeReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
              <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{formatRupiah(revenueSummary.totalInvoiced)}</p>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{revenueSummary.count} Invoices</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash Collected</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">{formatRupiah(revenueSummary.totalPaid)}</p>
              <p className="text-xs text-emerald-600 mt-0.5 tabular-nums font-medium">
                {((revenueSummary.totalPaid / (revenueSummary.totalInvoiced || 1)) * 100).toFixed(1)}% Collection Ratio
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
              <p className="text-xl font-bold text-amber-600 mt-1 tabular-nums">{formatRupiah(revenueSummary.totalOutstanding)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Receivables</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Output VAT (PPN)</p>
              <p className="text-xl font-bold text-blue-600 mt-1 tabular-nums">{formatRupiah(revenueSummary.totalTax)}</p>
              <p className="text-xs text-slate-500 mt-0.5">VAT Obligations</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 tracking-tight">
              Invoice Ledger & Settlement Performance
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 tracking-wider">Date</th>
                    <th className="px-6 py-3 tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-right tracking-wider">DPP Subtotal</th>
                    <th className="px-6 py-3 text-right tracking-wider">PPN 11%</th>
                    <th className="px-6 py-3 text-right tracking-wider">Grand Total</th>
                    <th className="px-6 py-3 text-right tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-right tracking-wider">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600 tabular-nums">{inv.invoiceNumber}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 tabular-nums">{formatIndoDate(inv.issueDate)}</td>
                      <td className="px-6 py-3.5 text-xs font-medium text-slate-900">{inv.customerName}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-slate-700">{formatRupiah(inv.subtotal)}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-slate-600">{formatRupiah(inv.taxAmount)}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-bold text-slate-900">{formatRupiah(inv.grandTotal)}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-emerald-600 font-semibold">{formatRupiah(inv.paidAmount)}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-bold text-amber-600">{formatRupiah(inv.outstandingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Aging Receivables Report */}
      {activeReport === 'aging' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 tracking-tight">
              Customer Aging Schedule Analysis
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 tracking-wider">Customer Entity</th>
                    <th className="px-6 py-3 text-right tracking-wider">Current (Not Due)</th>
                    <th className="px-6 py-3 text-right tracking-wider">1 - 30 Days</th>
                    <th className="px-6 py-3 text-right tracking-wider">31 - 60 Days</th>
                    <th className="px-6 py-3 text-right tracking-wider">61 - 90 Days</th>
                    <th className="px-6 py-3 text-right tracking-wider text-rose-600">&gt; 90 Days</th>
                    <th className="px-6 py-3 text-right tracking-wider font-bold">Total Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {customerAgingData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No outstanding receivables at this time.
                      </td>
                    </tr>
                  ) : (
                    customerAgingData.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900 text-xs">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.companyName}</p>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-slate-600">{formatRupiah(c.current)}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-slate-700">{formatRupiah(c.d1_30)}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-amber-600">{formatRupiah(c.d31_60)}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-orange-600">{formatRupiah(c.d61_90)}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-bold text-rose-600">{formatRupiah(c.dOver90)}</td>
                        <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-bold text-slate-900">
                          {formatRupiah(c.totalOutstanding)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cash Flow Payments Report */}
      {activeReport === 'cashflow' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 tracking-tight">
              Cash Inflow Ledger & Collections
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 tracking-wider">Receipt No</th>
                    <th className="px-6 py-3 tracking-wider">Receipt Date</th>
                    <th className="px-6 py-3 tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 tracking-wider">Customer</th>
                    <th className="px-6 py-3 tracking-wider">Method</th>
                    <th className="px-6 py-3 text-right tracking-wider">Inflow Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-emerald-600 tabular-nums">{p.receiptNumber}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-700 tabular-nums">{formatIndoDate(p.paymentDate)}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-blue-600 tabular-nums">{p.invoiceNumber}</td>
                      <td className="px-6 py-3.5 text-xs font-medium text-slate-900">{p.customerName}</td>
                      <td className="px-6 py-3.5 text-xs uppercase text-slate-600 font-medium">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-6 py-3.5 text-right font-bold font-mono text-xs tabular-nums text-emerald-600">{formatRupiah(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tax / PPN Keluaran Report */}
      {activeReport === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tax Base (DPP)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatRupiah(totalDpp)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Output VAT 11%</p>
              <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{formatRupiah(totalPpn)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 tracking-tight">
              Output VAT (PPN Keluaran) Tax Summary
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 tracking-wider">Date</th>
                    <th className="px-6 py-3 tracking-wider">Client Entity</th>
                    <th className="px-6 py-3 tracking-wider">NPWP</th>
                    <th className="px-6 py-3 text-right tracking-wider">DPP (Rp)</th>
                    <th className="px-6 py-3 text-center tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-right tracking-wider">VAT Due (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {taxSummary.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600 tabular-nums">{t.noInvoice}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 tabular-nums">{formatIndoDate(t.tanggal)}</td>
                      <td className="px-6 py-3.5 text-xs font-medium text-slate-900">{t.pelanggan}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600 tabular-nums">{t.npwp}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-semibold text-slate-900">{formatRupiah(t.dpp)}</td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-700 text-xs tabular-nums">{t.tarifPpn}</td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums font-bold text-blue-600">{formatRupiah(t.ppn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
