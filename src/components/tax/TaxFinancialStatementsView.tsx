import React, { useState } from 'react';
import {
  IncomeStatementData,
  BalanceSheetData,
  EquityStatementData,
  CashFlowData,
  NotesToFinancialStatementsData,
  FinancialAccountBreakdown,
} from '../../types/tax';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Scale,
  TrendingUp,
  Layers,
  Activity,
  BookOpen,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Calendar,
  Filter,
  Info,
  ExternalLink,
} from 'lucide-react';

interface TaxFinancialStatementsViewProps {
  year: number;
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  equityStatement?: EquityStatementData;
  equityChange?: EquityStatementData;
  cashFlowStatement?: CashFlowData;
  cashFlow?: CashFlowData;
  notesToFinancialStatements?: NotesToFinancialStatementsData;
  calk?: NotesToFinancialStatementsData;
  onDrilldownAccount?: (accountCode: string, accountName: string, amount: number) => void;
  onNavigateTab?: (tabKey: any) => void;
}

export const TaxFinancialStatementsView: React.FC<TaxFinancialStatementsViewProps> = ({
  year,
  incomeStatement: is,
  balanceSheet: bs,
  equityStatement,
  equityChange,
  cashFlowStatement,
  cashFlow,
  notesToFinancialStatements,
  calk,
  onDrilldownAccount,
  onNavigateTab,
}) => {
  const eq = equityStatement || equityChange || {
    year,
    beginningCapital: bs.paidInCapital || 0,
    capitalAdditions: 0,
    capitalReductions: 0,
    currentYearProfitOrLoss: is.netProfitAfterTax || 0,
    dividendsOrDrawings: 0,
    retainedEarningsBeginning: bs.retainedEarnings || 0,
    endingRetainedEarnings: (bs.retainedEarnings || 0) + (is.netProfitAfterTax || 0),
    endingEquity: bs.totalEquity || 0,
  };
  const cf = cashFlowStatement || cashFlow || {
    year,
    customerReceipts: 0,
    supplierPayments: 0,
    operatingExpensesPaid: 0,
    taxesPaid: 0,
    netCashFromOperations: 0,
    fixedAssetsPurchased: 0,
    fixedAssetsSold: 0,
    netCashFromInvesting: 0,
    capitalInjections: 0,
    bankLoanProceeds: 0,
    bankLoanRepayments: 0,
    dividendsPaid: 0,
    netCashFromFinancing: 0,
    beginningCashBalance: 0,
    netCashChange: 0,
    endingCashBalance: 0,
  };
  const notes = notesToFinancialStatements || calk || {
    companyProfile: {
      name: 'PT Digital Solusi Nusantara',
      npwp: '01.234.567.8-012.000',
      address: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
      businessActivity: 'Software Development & IT Consulting',
      kbliCode: '62019',
      incorporationDeed: 'Akta Notaris No. 42',
      directors: 'Ahmad Fauzi',
      commissioners: 'Dewi Kartika',
    },
    accountingPolicies: {
      basisOfPreparation: 'SAK EMKM',
      revenueRecognition: 'Akrual',
      inventoryMethod: 'FIFO',
      depreciationPolicy: 'Garis Lurus',
      taxationPolicy: 'Pasal 31E UU PPh',
    },
    details: {
      cashAndBankNotes: '',
      receivablesNotes: '',
      inventoryNotes: '',
      fixedAssetsNotes: '',
      payablesNotes: '',
      equityNotes: '',
      revenueNotes: '',
      taxationNotes: '',
      subsequentEvents: 'Tidak ada peristiwa setelah tanggal neraca.',
      contingencies: 'Tidak ada sengketa material.',
    },
  };
  const [activeSubTab, setActiveSubTab] = useState<'income' | 'balance_sheet' | 'equity' | 'cash_flow' | 'notes'>('income');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    operating_expenses: true,
    current_assets: true,
    fixed_assets: true,
    current_liabilities: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportStatementCSV = () => {
    if (activeSubTab === 'income') {
      const data = [
        { Kategori: 'Pendapatan', Akun: 'Penjualan Bruto', Nominal: is.grossSales },
        { Kategori: 'Pendapatan', Akun: 'Potongan Penjualan', Nominal: -is.salesDiscounts },
        { Kategori: 'Pendapatan', Akun: 'Penjualan Bersih', Nominal: is.netSales },
        { Kategori: 'HPP', Akun: 'Persediaan Awal', Nominal: is.beginningInventory },
        { Kategori: 'HPP', Akun: 'Pembelian & Beban Pokok', Nominal: is.purchases },
        { Kategori: 'HPP', Akun: 'Ongkos Angkut Pembelian', Nominal: is.freightIn },
        { Kategori: 'HPP', Akun: 'Persediaan Akhir', Nominal: -is.endingInventory },
        { Kategori: 'HPP', Akun: 'Total HPP', Nominal: is.cogs },
        { Kategori: 'Laba', Akun: 'Laba Kotor', Nominal: is.grossProfit },
        { Kategori: 'Beban Usaha', Akun: 'Total Beban Usaha', Nominal: is.totalOperatingExpenses },
        { Kategori: 'Laba', Akun: 'Laba Bersih Sebelum Pajak', Nominal: is.netProfitBeforeTax },
        { Kategori: 'Pajak', Akun: 'Estimasi Beban Pajak (Pasal 31E)', Nominal: is.estimatedTaxExpense },
        { Kategori: 'Laba', Akun: 'Laba Bersih Setelah Pajak', Nominal: is.netProfitAfterTax },
      ];
      exportToCSV(`Laporan_Laba_Rugi_${year}`, data);
    } else if (activeSubTab === 'balance_sheet') {
      const data = [
        { Kelompok: 'Aset Lancar', Akun: 'Kas & Bank', Nominal: bs.cashOnPremises + bs.bankBalances },
        { Kelompok: 'Aset Lancar', Akun: 'Piutang Usaha Bersih', Nominal: bs.netTradeReceivables },
        { Kelompok: 'Aset Lancar', Akun: 'Persediaan Barang', Nominal: bs.inventory },
        { Kelompok: 'Aset Lancar', Akun: 'Uang Muka & Pajak Dimuka', Nominal: bs.prepaidExpenses + bs.prepaidTaxes },
        { Kelompok: 'Aset Lancar', Akun: 'Total Aset Lancar', Nominal: bs.totalCurrentAssets },
        { Kelompok: 'Aset Tetap', Akun: 'Nilai Buku Aset Tetap Bersih', Nominal: bs.netFixedAssets },
        { Kelompok: 'Total', Akun: 'TOTAL ASET', Nominal: bs.totalAssets },
        { Kelompok: 'Liabilitas', Akun: 'Total Liabilitas', Nominal: bs.totalLiabilities },
        { Kelompok: 'Ekuitas', Akun: 'Modal Disetor', Nominal: bs.paidInCapital },
        { Kelompok: 'Ekuitas', Akun: 'Laba Ditahan & Laba Berjalan', Nominal: bs.retainedEarnings + bs.currentYearEarnings },
        { Kelompok: 'Ekuitas', Akun: 'Total Ekuitas', Nominal: bs.totalEquity },
        { Kelompok: 'Total', Akun: 'TOTAL LIABILITAS & EKUITAS', Nominal: bs.totalLiabilitiesAndEquity },
      ];
      exportToCSV(`Neraca_Posisi_Keuangan_${year}`, data);
    } else if (activeSubTab === 'cash_flow') {
      const data = [
        { Aktivitas: 'Operasi', Uraian: 'Penerimaan dari Pelanggan', Nominal: cf.customerReceipts },
        { Aktivitas: 'Operasi', Uraian: 'Pembayaran ke Supplier & Operasional', Nominal: -(cf.supplierPayments + cf.operatingExpensesPaid) },
        { Aktivitas: 'Operasi', Uraian: 'Pembayaran Pajak Kas Negara', Nominal: -cf.taxesPaid },
        { Aktivitas: 'Operasi', Uraian: 'Arus Kas Bersih Operasi', Nominal: cf.netCashFromOperations },
        { Aktivitas: 'Investasi', Uraian: 'Perolehan Aset Tetap', Nominal: -cf.fixedAssetsPurchased },
        { Aktivitas: 'Pendanaan', Uraian: 'Arus Kas Bersih Pendanaan', Nominal: cf.netCashFromFinancing },
        { Aktivitas: 'Kas', Uraian: 'Saldo Kas Akhir Periode', Nominal: cf.endingCashBalance },
      ];
      exportToCSV(`Laporan_Arus_Kas_${year}`, data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Laporan Keuangan Standar (SAK EMKM / PSAK)
                </h3>
                <p className="text-xs text-slate-500">
                  Basis data pembukuan otomatis untuk SPT Tahunan PPh Badan 1771 & Coretax
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportStatementCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV/Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </Button>
          </div>
        </div>

        {/* 5 Financial Statement Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('income')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'income'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            1. Laba Rugi (Income Statement)
          </button>
          <button
            onClick={() => setActiveSubTab('balance_sheet')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'balance_sheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            2. Neraca (Posisi Keuangan)
            {bs.isBalanced ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('equity')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'equity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Perubahan Ekuitas
          </button>
          <button
            onClick={() => setActiveSubTab('cash_flow')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'cash_flow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            4. Arus Kas (Cash Flow)
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'notes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            5. Catatan atas Laporan Keuangan (CaLK)
          </button>
        </div>
      </div>

      {/* SUBTAB 1: LABA RUGI */}
      {activeSubTab === 'income' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="text-center max-w-xl mx-auto">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                PT DIGITAL SOLUSI NUSANTARA
              </h4>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                LAPORAN LABA RUGI KOMPREHENSIF
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Untuk Periode yang Berakhir pada 31 Desember {year} (Dinyatakan dalam Rupiah)
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6 text-sm">
            {/* 1. Pendapatan Usaha */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>1. PENDAPATAN & PENJUALAN</span>
                <span>NOMINAL (RP)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div
                  className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded cursor-pointer transition-colors"
                  onClick={() => onDrilldownAccount?.('4-1000', 'Penjualan Bruto', is.grossSales)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-medium">Penjualan Bruto (Gross Sales)</span>
                    <span className="text-[11px] text-blue-600 underline">rincian</span>
                  </div>
                  <span className="font-mono font-medium text-slate-900">
                    {formatRupiah(is.grossSales)}
                  </span>
                </div>
                {is.salesDiscounts > 0 && (
                  <div className="py-2.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded">
                    <span className="text-slate-600 pl-4">Potongan Penjualan & Diskon</span>
                    <span className="font-mono text-rose-600">
                      ({formatRupiah(is.salesDiscounts)})
                    </span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between items-center bg-blue-50/40 px-2 rounded font-semibold text-blue-950">
                  <span>PENJUALAN BERSIH (NET SALES)</span>
                  <span className="font-mono">{formatRupiah(is.netSales)}</span>
                </div>
              </div>
            </div>

            {/* 2. HPP */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                <span>NOMINAL (RP)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Persediaan Awal Barang</span>
                  <span className="font-mono">{formatRupiah(is.beginningInventory)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Pembelian Bahan & Jasa Subkontrak</span>
                  <span className="font-mono">{formatRupiah(is.purchases)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Ongkos Angkut Pembelian</span>
                  <span className="font-mono">{formatRupiah(is.freightIn)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Persediaan Akhir Barang</span>
                  <span className="font-mono text-emerald-600">
                    ({formatRupiah(is.endingInventory)})
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-slate-50 px-2 rounded font-semibold text-slate-900">
                  <span>TOTAL HARGA POKOK PENJUALAN (HPP)</span>
                  <span className="font-mono">({formatRupiah(is.cogs)})</span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-emerald-50/50 px-2 rounded font-bold text-emerald-950">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="font-mono text-emerald-700">{formatRupiah(is.grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* 3. Beban Usaha */}
            <div>
              <div
                onClick={() => toggleGroup('operating_expenses')}
                className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {expandedGroups.operating_expenses ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span>3. BEBAN USAHA / OPERASIONAL</span>
                </div>
                <span>NOMINAL (RP)</span>
              </div>

              {expandedGroups.operating_expenses && (
                <div className="divide-y divide-slate-100 mt-1">
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Gaji & Tunjangan Karyawan</span>
                    <span className="font-mono">{formatRupiah(is.salariesAndWages)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Sewa Gedung & Kantor</span>
                    <span className="font-mono">{formatRupiah(is.rentExpense)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Listrik, Air & Utilitas</span>
                    <span className="font-mono">{formatRupiah(is.utilitiesElectricityWater)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Internet, Server Cloud & Hosting</span>
                    <span className="font-mono">{formatRupiah(is.internetAndTelecom)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Transportasi & Perjalanan Dinas</span>
                    <span className="font-mono">{formatRupiah(is.transportationAndTravel)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Pengiriman & Logistik</span>
                    <span className="font-mono">{formatRupiah(is.shippingAndDelivery)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Pemasaran, Promosi & Iklan</span>
                    <span className="font-mono">{formatRupiah(is.marketingAndPromotion)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Perlengkapan & Administrasi Kantor</span>
                    <span className="font-mono">{formatRupiah(is.officeAndAdministration)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Administrasi Bank & Payment Gateway</span>
                    <span className="font-mono">{formatRupiah(is.bankChargesAndFees)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Penyusutan Aset Tetap (Komersial)</span>
                    <span className="font-mono">{formatRupiah(is.depreciationExpense)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-slate-600 pl-4 hover:bg-slate-50 rounded">
                    <span>Beban Operasional Lain-lain</span>
                    <span className="font-mono">{formatRupiah(is.otherOperatingExpenses)}</span>
                  </div>
                </div>
              )}

              <div className="py-2.5 flex justify-between items-center bg-slate-50 px-2 rounded font-semibold text-slate-900 mt-2">
                <span>TOTAL BEBAN USAHA</span>
                <span className="font-mono">({formatRupiah(is.totalOperatingExpenses)})</span>
              </div>
            </div>

            {/* 4. Laba Operasional & Pajak */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="py-2 flex justify-between items-center text-slate-600 px-2">
                <span>Pendapatan / (Beban) Lain-lain Bersih (Bunga Bank, Selisih Kurs)</span>
                <span className="font-mono font-medium text-emerald-600">
                  +{formatRupiah(is.netOtherIncome)}
                </span>
              </div>

              <div className="py-3 flex justify-between items-center bg-blue-50 px-3 rounded-lg font-bold text-blue-950 text-base">
                <span>LABA BERSIH SEBELUM PAJAK (KOMERSIAL)</span>
                <span className="font-mono text-blue-700">{formatRupiah(is.netProfitBeforeTax)}</span>
              </div>

              <div className="py-2 flex justify-between items-center text-slate-600 px-3 text-xs">
                <span>Estimasi Beban Pajak Penghasilan Badan (Fasilitas Ps 31E UU HPP)</span>
                <span className="font-mono text-rose-600 font-medium">
                  ({formatRupiah(is.estimatedTaxExpense)})
                </span>
              </div>

              <div className="py-3.5 flex justify-between items-center bg-emerald-600 text-white px-3 rounded-lg font-extrabold text-base shadow-xs">
                <span>LABA BERSIH SETELAH PAJAK (NET INCOME)</span>
                <span className="font-mono">{formatRupiah(is.netProfitAfterTax)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: NERACA */}
      {activeSubTab === 'balance_sheet' && (
        <div className="space-y-4">
          {/* Balance Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              bs.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {bs.isBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">
                {bs.isBalanced ? 'Neraca Seimbang (Balance Valid)' : 'Perhatian: Neraca Belum Seimbang'}
              </h4>
              <p className="text-xs mt-0.5">{bs.balanceExplanation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sisi Kiri: Aset */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-900 flex justify-between items-center">
                <span>ASET (AKTIVA)</span>
                <Badge variant="info">31 Des {year}</Badge>
              </div>

              <div className="p-4 space-y-4 text-xs sm:text-sm">
                {/* Aset Lancar */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                    Aset Lancar
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Kas di Tangan (Petty Cash)</span>
                      <span className="font-mono">{formatRupiah(bs.cashOnPremises)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Bank (BCA & Mandiri)</span>
                      <span className="font-mono">{formatRupiah(bs.bankBalances)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Piutang Usaha (Gross)</span>
                      <span className="font-mono">{formatRupiah(bs.tradeReceivables)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center text-slate-500">
                      <span>Penyisihan Piutang Ragu-ragu</span>
                      <span className="font-mono text-rose-600">
                        ({formatRupiah(bs.allowanceForBadDebts)})
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Persediaan Barang Dagang</span>
                      <span className="font-mono">{formatRupiah(bs.inventory)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Biaya & Pajak Dibayar Dimuka</span>
                      <span className="font-mono">
                        {formatRupiah(bs.prepaidExpenses + bs.prepaidTaxes)}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-semibold bg-slate-50 px-2 rounded">
                      <span>Total Aset Lancar</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(bs.totalCurrentAssets)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aset Tetap */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                    Aset Tetap
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Peralatan, Komputer & Kendaraan</span>
                      <span className="font-mono">
                        {formatRupiah(bs.equipmentAndComputers + bs.vehicles)}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between items-center text-slate-500">
                      <span>Akumulasi Penyusutan (Komersial)</span>
                      <span className="font-mono text-rose-600">
                        ({formatRupiah(bs.accumulatedDepreciation)})
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-semibold bg-slate-50 px-2 rounded">
                      <span>Nilai Buku Aset Tetap Bersih</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(bs.netFixedAssets)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Aset */}
                <div className="py-3 px-3 bg-blue-600 text-white rounded-lg flex justify-between items-center font-bold text-base shadow-xs">
                  <span>TOTAL ASET</span>
                  <span className="font-mono">{formatRupiah(bs.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Liabilitas & Ekuitas */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-900 flex justify-between items-center">
                <span>LIABILITAS & EKUITAS (PASIVA)</span>
                <Badge variant="info">31 Des {year}</Badge>
              </div>

              <div className="p-4 space-y-4 text-xs sm:text-sm">
                {/* Liabilitas Jangka Pendek */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                    Liabilitas Jangka Pendek
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Utang Usaha Supplier</span>
                      <span className="font-mono">{formatRupiah(bs.tradePayables)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Utang Pajak (PPN, PPh 21, 23, 29)</span>
                      <span className="font-mono">{formatRupiah(bs.taxPayables)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Beban Akrual Gaji & Operasional</span>
                      <span className="font-mono">{formatRupiah(bs.accruedExpenses)}</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-semibold bg-slate-50 px-2 rounded">
                      <span>Total Liabilitas Jangka Pendek</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(bs.totalCurrentLiabilities)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liabilitas Jangka Panjang */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                    Liabilitas Jangka Panjang
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Utang Pemegang Saham (Hubungan Istimewa)</span>
                      <span className="font-mono">{formatRupiah(bs.shareholderLoans)}</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-semibold bg-slate-50 px-2 rounded">
                      <span>Total Liabilitas</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(bs.totalLiabilities)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ekuitas */}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                    Ekuitas Pemilik
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Modal Disetor (Akta Notaris)</span>
                      <span className="font-mono">{formatRupiah(bs.paidInCapital)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Laba Ditahan (Retained Earnings)</span>
                      <span className="font-mono">{formatRupiah(bs.retainedEarnings)}</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-slate-600">Laba Bersih Tahun Berjalan {year}</span>
                      <span className="font-mono text-emerald-600">
                        {formatRupiah(bs.currentYearEarnings)}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center font-semibold bg-slate-50 px-2 rounded">
                      <span>Total Ekuitas</span>
                      <span className="font-mono text-slate-900">
                        {formatRupiah(bs.totalEquity)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Liabilitas & Ekuitas */}
                <div className="py-3 px-3 bg-blue-600 text-white rounded-lg flex justify-between items-center font-bold text-base shadow-xs">
                  <span>TOTAL LIABILITAS & EKUITAS</span>
                  <span className="font-mono">{formatRupiah(bs.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERUBAHAN EKUITAS */}
      {activeSubTab === 'equity' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 text-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              PT DIGITAL SOLUSI NUSANTARA
            </h4>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              LAPORAN PERUBAHAN EKUITAS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tahun Buku yang Berakhir pada 31 Desember {year}
            </p>
          </div>

          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Modal Saham</th>
                    <th className="py-3 px-4 text-right">Laba Ditahan</th>
                    <th className="py-3 px-4 text-right">Total Ekuitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      Saldo Awal per 1 Januari {year}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatRupiah(eq.beginningCapital)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatRupiah(eq.retainedEarningsBeginning)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(eq.beginningCapital + eq.retainedEarningsBeginning)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans text-slate-600 pl-6">
                      Penambahan Modal Disetor
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {formatRupiah(eq.capitalAdditions)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">-</td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatRupiah(eq.capitalAdditions)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans text-slate-600 pl-6">
                      Laba Bersih Tahun Berjalan {year}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">-</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      +{formatRupiah(eq.currentYearProfitOrLoss)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      +{formatRupiah(eq.currentYearProfitOrLoss)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-sans text-slate-600 pl-6">
                      Pembagian Dividen / Penarikan Prive
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">-</td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      ({formatRupiah(eq.dividendsOrDrawings)})
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      ({formatRupiah(eq.dividendsOrDrawings)})
                    </td>
                  </tr>
                  <tr className="bg-blue-50/60 font-bold">
                    <td className="py-3.5 px-4 font-sans text-blue-950">
                      Saldo Akhir per 31 Desember {year}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-950">
                      {formatRupiah(eq.beginningCapital + eq.capitalAdditions)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-950">
                      {formatRupiah(eq.endingRetainedEarnings)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-700 text-base">
                      {formatRupiah(eq.endingEquity)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: ARUS KAS */}
      {activeSubTab === 'cash_flow' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 text-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              PT DIGITAL SOLUSI NUSANTARA
            </h4>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              LAPORAN ARUS KAS (METODE LANGSUNG)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Periode 1 Januari - 31 Desember {year}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-6 text-sm">
            {/* 1. Arus Kas Operasi */}
            <div>
              <div className="flex justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>ARUS KAS DARI AKTIVITAS OPERASI</span>
                <span>NOMINAL (RP)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Penerimaan Kas dari Pelanggan</span>
                  <span className="font-mono text-emerald-600">+{formatRupiah(cf.customerReceipts)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Pembayaran Kas ke Pemasok & Vendor</span>
                  <span className="font-mono text-rose-600">({formatRupiah(cf.supplierPayments)})</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Pembayaran Kas untuk Beban Operasional & Gaji</span>
                  <span className="font-mono text-rose-600">({formatRupiah(cf.operatingExpensesPaid)})</span>
                </div>
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Pembayaran Pajak Penghasilan ke Kas Negara</span>
                  <span className="font-mono text-rose-600">({formatRupiah(cf.taxesPaid)})</span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-slate-50 px-2 rounded font-semibold text-slate-900">
                  <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(cf.netCashFromOperations)}</span>
                </div>
              </div>
            </div>

            {/* 2. Arus Kas Investasi */}
            <div>
              <div className="flex justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>ARUS KAS DARI AKTIVITAS INVESTASI</span>
                <span>NOMINAL (RP)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Perolehan / Pembelian Aset Tetap & Peralatan</span>
                  <span className="font-mono text-rose-600">({formatRupiah(cf.fixedAssetsPurchased)})</span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-slate-50 px-2 rounded font-semibold text-slate-900">
                  <span>Arus Kas Bersih Digunakan untuk Investasi</span>
                  <span className="font-mono text-rose-600">({formatRupiah(Math.abs(cf.netCashFromInvesting))})</span>
                </div>
              </div>
            </div>

            {/* 3. Arus Kas Pendanaan */}
            <div>
              <div className="flex justify-between pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>ARUS KAS DARI AKTIVITAS PENDANAAN</span>
                <span>NOMINAL (RP)</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between items-center text-slate-600 pl-4">
                  <span>Penerimaan / Setoran Modal & Pinjaman</span>
                  <span className="font-mono text-slate-500">Rp 0</span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-slate-50 px-2 rounded font-semibold text-slate-900">
                  <span>Arus Kas Bersih dari Pendanaan</span>
                  <span className="font-mono text-slate-900">{formatRupiah(cf.netCashFromFinancing)}</span>
                </div>
              </div>
            </div>

            {/* Rekonsiliasi Saldo Kas */}
            <div className="space-y-2 pt-2 border-t border-slate-200 font-semibold">
              <div className="py-2 flex justify-between items-center text-slate-700 px-2">
                <span>Kenaikan / (Penurunan) Bersih Kas dan Setara Kas</span>
                <span className="font-mono text-blue-600">{formatRupiah(cf.netCashChange)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-slate-700 px-2">
                <span>Saldo Kas dan Setara Kas Awal Periode</span>
                <span className="font-mono">{formatRupiah(cf.beginningCashBalance)}</span>
              </div>
              <div className="py-3 flex justify-between items-center bg-blue-600 text-white px-3 rounded-lg font-bold text-base shadow-xs">
                <span>SALDO KAS DAN SETARA KAS AKHIR PERIODE</span>
                <span className="font-mono">{formatRupiah(cf.endingCashBalance)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: CaLK */}
      {activeSubTab === 'notes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              PT DIGITAL SOLUSI NUSANTARA
            </h4>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              CATATAN ATAS LAPORAN KEUANGAN (CaLK)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tahun Pajak {year} (Sesuai Lampiran SPT 1771 & SAK EMKM)
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            {/* 1. Profil Perusahaan */}
            <section className="space-y-2">
              <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
                Informasi Umum Entitas
              </h5>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-medium">Nama Perusahaan:</span>{' '}
                    <span className="font-bold text-slate-800">{notes.companyProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">NPWP Badan:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">{notes.companyProfile.npwp}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-500 font-medium">Alamat Domisili:</span>{' '}
                    <span className="text-slate-800">{notes.companyProfile.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Klasifikasi Usaha (KBLI):</span>{' '}
                    <span className="text-slate-800">{notes.companyProfile.kbliCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Pengurus & Direksi:</span>{' '}
                    <span className="text-slate-800">{notes.companyProfile.directors}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Kebijakan Akuntansi */}
            <section className="space-y-2">
              <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
                Ikhtisar Kebijakan Akuntansi Penting
              </h5>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
                <li>
                  <strong className="text-slate-800">Dasar Penyusunan:</strong> {notes.accountingPolicies.basisOfPreparation}
                </li>
                <li>
                  <strong className="text-slate-800">Pengakuan Pendapatan:</strong> {notes.accountingPolicies.revenueRecognition}
                </li>
                <li>
                  <strong className="text-slate-800">Kebijakan Persediaan:</strong> {notes.accountingPolicies.inventoryMethod}
                </li>
                <li>
                  <strong className="text-slate-800">Aset Tetap & Penyusutan:</strong> {notes.accountingPolicies.depreciationPolicy}
                </li>
                <li>
                  <strong className="text-slate-800">Perpajakan:</strong> {notes.accountingPolicies.taxationPolicy}
                </li>
              </ul>
            </section>

            {/* 3. Penjelasan Rincian Akun */}
            <section className="space-y-3">
              <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">3</span>
                Penjelasan Rincian Pos-pos Laporan Keuangan
              </h5>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <h6 className="font-bold text-slate-900 mb-1">Kas dan Setara Kas</h6>
                  <p className="text-slate-600">{notes.details.cashAndBankNotes}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <h6 className="font-bold text-slate-900 mb-1">Piutang Usaha</h6>
                  <p className="text-slate-600">{notes.details.receivablesNotes}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <h6 className="font-bold text-slate-900 mb-1">Aset Tetap & Penyusutan</h6>
                  <p className="text-slate-600">{notes.details.fixedAssetsNotes}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <h6 className="font-bold text-slate-900 mb-1">Utang dan Kewajiban Pajak</h6>
                  <p className="text-slate-600">{notes.details.payablesNotes}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <h6 className="font-bold text-slate-900 mb-1">Pendapatan dan Beban Pajak</h6>
                  <p className="text-slate-600">{notes.details.revenueNotes}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
