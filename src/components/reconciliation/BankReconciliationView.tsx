import React, { useState, useMemo, useEffect } from 'react';
import {
  BankTransaction,
  BankFeedConnection,
  ReconciliationSummary,
  Invoice,
  Payment,
} from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { BankFeedConnectModal } from './BankFeedConnectModal';
import { ManualMatchModal } from './ManualMatchModal';
import {
  Landmark,
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck2,
  FileText,
  Filter,
  Check,
  Eye,
  XCircle,
  HelpCircle,
  Building,
  CreditCard,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface BankReconciliationViewProps {
  onViewInvoice?: (invoiceId: string) => void;
  onViewReceipt?: (payment: Payment) => void;
}

export const BankReconciliationView: React.FC<BankReconciliationViewProps> = ({
  onViewInvoice,
  onViewReceipt,
}) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [connections, setConnections] = useState<BankFeedConnection[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);

  // Filters
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'unmatched' | 'matched' | 'reconciled' | 'ignored'>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Interactivity
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [manualMatchTx, setManualMatchTx] = useState<BankTransaction | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const loadData = () => {
    setTransactions(StorageService.getBankTransactions());
    setConnections(StorageService.getBankConnections());
    setSummary(StorageService.getReconciliationSummary());
  };

  useEffect(() => {
    loadData();
    const unsub = StorageService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Run auto-match scan
  const handleAutoMatchScan = () => {
    const res = StorageService.autoMatchTransactions();
    loadData();
    showToast(`Pemindaian selesai: ${res.matchedCount} transaksi cocok dengan invoice.`);
  };

  // One-click Batch Reconcile
  const handleBatchAutoReconcile = () => {
    const res = StorageService.autoReconcileAllMatched(85);
    loadData();
    if (res.reconciledCount > 0) {
      showToast(
        `Berhasil merekonsiliasi ${res.reconciledCount} mutasi (${formatRupiah(res.totalAmountReconciled)}) menjadi kuitansi pembayaran resmi!`
      );
    } else {
      showToast('Tidak ada transaksi dengan kecocokan tinggi yang perlu direkonsiliasi.', 'info');
    }
  };

  // Sync Feed Simulation
  const handleSyncFeed = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate drawing latest mutations from BCA
      StorageService.importSampleFeedPreset('bca_live');
      setIsSyncing(false);
      loadData();
      showToast('Sinkronisasi rekening berhasil! Mutasi bank teranyar telah ditarik.');
    }, 900);
  };

  // Quick single transaction reconcile
  const handleQuickReconcile = (tx: BankTransaction) => {
    if (!tx.matchedInvoiceId) {
      setManualMatchTx(tx);
      return;
    }
    try {
      const res = StorageService.reconcileTransaction(tx.id, tx.matchedInvoiceId);
      loadData();
      showToast(res.message);
    } catch (err: any) {
      alert(err.message || 'Gagal merekonsiliasi');
    }
  };

  const handleIgnoreTx = (txId: string) => {
    StorageService.ignoreBankTransaction(txId);
    loadData();
    showToast('Transaksi ditandai abaikan (non-tagihan).', 'info');
  };

  const handleUnmatchTx = (txId: string) => {
    StorageService.unmatchBankTransaction(txId);
    loadData();
    showToast('Kecocokan dibatalkan.', 'info');
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return transactions.filter((tx) => {
      // Status filter
      if (activeFilterTab !== 'all' && tx.status !== activeFilterTab) return false;

      // Bank filter
      if (selectedBank !== 'all' && !tx.bankName.toLowerCase().includes(selectedBank.toLowerCase())) {
        return false;
      }

      // Search query
      if (q) {
        const matchSearch =
          tx.description.toLowerCase().includes(q) ||
          tx.referenceNumber.toLowerCase().includes(q) ||
          tx.bankName.toLowerCase().includes(q) ||
          (tx.matchedInvoiceNumber && tx.matchedInvoiceNumber.toLowerCase().includes(q)) ||
          (tx.matchedCustomerName && tx.matchedCustomerName.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [transactions, activeFilterTab, selectedBank, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: transactions.length,
      unmatched: transactions.filter((t) => t.status === 'unmatched').length,
      matched: transactions.filter((t) => t.status === 'matched').length,
      reconciled: transactions.filter((t) => t.status === 'reconciled').length,
      ignored: transactions.filter((t) => t.status === 'ignored').length,
    };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 p-4 rounded-xl shadow-lg border bg-white border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-medium">{toastMessage.text}</div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Bank Reconciliation & Auto-Match Feed
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi mutasi rekening koran dan catat pelunasan invoice secara otomatis
              </p>
            </div>
          </div>

          {/* Connection status pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              BCA Bisnis (8830 1928 33) : Connected
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Mandiri MCM (137 00 9823 4455) : Connected
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-800">
              <Sparkles className="w-3 h-3 text-blue-600" />
              BCA Virtual Account : Realtime
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFeed}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Sinkronisasi Feed
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectModalOpen(true)}
            leftIcon={<Landmark className="w-4 h-4 text-blue-600" />}
          >
            Impor / Hubungkan Bank
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoMatchScan}
            leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
            className="text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100"
          >
            Pindai Kecocokan
          </Button>

          <Button
            size="sm"
            onClick={handleBatchAutoReconcile}
            leftIcon={<Zap className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            Rekonsiliasi Otomatis ({counts.matched})
          </Button>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Mutasi Masuk (Feed)
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight">
                {formatRupiah(summary.totalInflowAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{summary.totalFeedTransactions} baris mutasi rekening</span>
              <span className="text-emerald-600 font-semibold">Aktif</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Terverifikasi (Lunas)
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1 tabular-nums tracking-tight">
                {formatRupiah(summary.reconciledAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{summary.reconciledCount} transaksi terselesaikan</span>
              <Badge variant="success" size="sm">Tercatat Kuitansi</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Siap Rekonsiliasi (Matched)
              </p>
              <p className="text-xl font-bold text-blue-600 mt-1 tabular-nums tracking-tight">
                {formatRupiah(summary.matchedReadyAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{summary.matchedReadyCount} transaksi cocok</span>
              <Badge variant="info" size="sm">1-Klik Verifikasi</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tingkat Rekonsiliasi
                </p>
                <span className="text-xs font-bold text-purple-700">
                  {summary.matchPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.matchPercentage}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{summary.unmatchedCount} perlu alokasi manual</span>
              <span className="text-amber-600 font-medium">Review Feed</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Mutasi
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('matched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'matched'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Siap Rekonsiliasi (Matched)
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-700 text-white">
              {counts.matched}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('unmatched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'unmatched'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Perlu Ditinjau (Unmatched)
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-700 text-white">
              {counts.unmatched}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('reconciled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'reconciled'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terverifikasi (Lunas)
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700 text-white">
              {counts.reconciled}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('ignored')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilterTab === 'ignored'
                ? 'bg-slate-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Biaya Bank / Diabaikan
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {counts.ignored}
            </span>
          </button>
        </div>

        {/* Search & Bank filter input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Cari berita transfer, nomor invoice, nama pelanggan, atau nomor referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Akun Bank Feed</option>
              <option value="BCA">Bank Central Asia (BCA)</option>
              <option value="Mandiri">Bank Mandiri</option>
              <option value="Virtual Account">BCA Virtual Account</option>
              <option value="QRIS">QRIS Settlement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List / Workspace */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Tidak ada mutasi yang cocok dengan filter yang dipilih
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Coba ubah kata kunci pencarian atau tarik mutasi rekening sampel baru dengan tombol Impor Bank di atas.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveFilterTab('all');
                setSelectedBank('all');
                setSearchQuery('');
              }}
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isCredit = tx.type === 'CR';
            const isReconciled = tx.status === 'reconciled';
            const isMatched = tx.status === 'matched';
            const isIgnored = tx.status === 'ignored';

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
                  isReconciled
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : isMatched
                    ? 'border-blue-200 bg-blue-50/20'
                    : isIgnored
                    ? 'border-slate-200 opacity-75'
                    : 'border-amber-200/80 bg-amber-50/15'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Bank Transaction Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          tx.bankName.includes('BCA')
                            ? 'info'
                            : tx.bankName.includes('Mandiri')
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {tx.bankName}
                      </Badge>

                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatIndoDate(tx.transactionDate)}
                      </span>

                      <span className="text-xs text-slate-400 font-mono">
                        Ref: {tx.referenceNumber || '-'}
                      </span>

                      {/* Status pill */}
                      {isReconciled && (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Terverifikasi Lunas
                        </Badge>
                      )}
                      {isMatched && (
                        <Badge variant="info" size="sm">
                          <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
                          Kecocokan {tx.matchConfidence}%
                        </Badge>
                      )}
                      {tx.status === 'unmatched' && (
                        <Badge variant="warning" size="sm">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Perlu Ditinjau
                        </Badge>
                      )}
                      {isIgnored && (
                        <Badge variant="neutral" size="sm">
                          Non-Tagihan / Diabaikan
                        </Badge>
                      )}
                    </div>

                    {/* Raw Description with highlighted keywords */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-xs text-slate-800 break-words">
                      {tx.description}
                    </div>

                    {/* Reconciled Info Timestamp */}
                    {isReconciled && tx.reconciledAt && (
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Diverifikasi oleh {tx.reconciledBy || 'Sistem'} pada{' '}
                        {new Date(tx.reconciledAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  {/* Middle/Right Column: Amount & Smart Match Card */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                        {isCredit ? (
                          <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span
                          className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                            isCredit ? 'text-emerald-600' : 'text-slate-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isCredit ? 'Penerimaan Dana (CR)' : 'Pengeluaran / Biaya (DB)'}
                      </span>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isMatched && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleQuickReconcile(tx)}
                            leftIcon={<Check className="w-4 h-4" />}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          >
                            Verifikasi Pembayaran
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setManualMatchTx(tx)}
                            className="text-xs"
                          >
                            Ubah
                          </Button>
                        </>
                      )}

                      {tx.status === 'unmatched' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setManualMatchTx(tx)}
                            leftIcon={<PlusCircle className="w-4 h-4" />}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Cocokkan Manual
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleIgnoreTx(tx.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                          >
                            Abaikan
                          </button>
                        </>
                      )}

                      {isReconciled && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUnmatchTx(tx.id)}
                            className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            Batal Rekonsiliasi
                          </button>
                        </div>
                      )}

                      {isIgnored && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnmatchTx(tx.id)}
                          className="text-xs"
                        >
                          Aktifkan Kembali
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Suggestion & Linked Document Ribbon */}
                {(tx.matchedInvoiceId || tx.matchedPaymentId || tx.matchReason) && (
                  <div
                    className={`mt-3.5 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                      isReconciled
                        ? 'border-emerald-200 text-emerald-900 bg-emerald-50/50 p-2.5 rounded-lg'
                        : isMatched
                        ? 'border-blue-200 text-blue-900 bg-blue-50/50 p-2.5 rounded-lg'
                        : 'border-slate-200 text-slate-700 bg-slate-50 p-2.5 rounded-lg'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isReconciled ? (
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <div className="min-w-0 truncate">
                        <span className="font-semibold">
                          {tx.matchedInvoiceNumber ? `Invoice ${tx.matchedInvoiceNumber}` : 'Tagihan Terkait'}:
                        </span>{' '}
                        <span className="font-medium text-slate-700">
                          {tx.matchedCustomerName || '-'}
                        </span>{' '}
                        {tx.matchReason && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({tx.matchReason})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tx.matchedInvoiceId && onViewInvoice && (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(tx.matchedInvoiceId!)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        >
                          Lihat Invoice
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <BankFeedConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={(count, msg) => {
          loadData();
          showToast(msg);
        }}
      />

      <ManualMatchModal
        isOpen={!!manualMatchTx}
        onClose={() => setManualMatchTx(null)}
        transaction={manualMatchTx}
        onSuccess={(payment, msg) => {
          loadData();
          showToast(msg);
        }}
      />
    </div>
  );
};
