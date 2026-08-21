import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StorageService } from '../../lib/storage';
import { formatRupiah } from '../../lib/utils';
import {
  Landmark,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface BankFeedConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, message: string) => void;
}

export const BankFeedConnectModal: React.FC<BankFeedConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'csv' | 'paste'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<'bca_live' | 'mandiri_mcm' | 'bca_va' | 'qris_batch'>('bca_live');
  const [loading, setLoading] = useState(false);

  // CSV upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<{
    date: string;
    description: string;
    amount: number;
    type: 'CR' | 'DB';
    ref?: string;
  }>>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Paste text state
  const [pasteText, setPasteText] = useState(
`18/08/2026 TRSF E-BANKING CR INV/2026/08/00004 PT MAKMUR JAYA LOGISTIK CR 17760000
19/08/2026 PEMINDAHBUKUAN CR KLINIK SEHAT UTAMA INV 00005 DP MEDIKA CR 12000000
20/08/2026 TRSF CR PT TELKOM PRIMA NUSANTARA CICILAN TMY CR 30000000
21/08/2026 BIAYA ADM PEMELIHARAAN REK GIRO DB 25000`
  );

  const handleImportPreset = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const res = StorageService.importSampleFeedPreset(selectedPreset);
        setLoading(false);
        onSuccess(res.count, `Berhasil menarik ${res.count} mutasi rekening sampel baru`);
        onClose();
      } catch (err: any) {
        setLoading(false);
        alert(err.message || 'Gagal mengimpor data feed');
      }
    }, 600);
  };

  const handleFileProcess = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setParseError('File kosong atau tidak dapat dibaca.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setParseError('File tidak berisi data baris transaksi.');
          return;
        }

        const parsed: Array<{
          date: string;
          description: string;
          amount: number;
          type: 'CR' | 'DB';
          ref?: string;
        }> = [];

        // Skip header if line 0 contains header text
        const startIdx = lines[0].toLowerCase().includes('tanggal') || lines[0].toLowerCase().includes('date') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(/[;,|\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 3) {
            const dateStr = parts[0] || new Date().toISOString().split('T')[0];
            const desc = parts[1] || 'Mutasi Bank';
            const amountRaw = (parts[2] || '0').replace(/[^0-9.-]/g, '');
            const num = Math.abs(parseFloat(amountRaw) || 0);
            const typeStr = (parts[3] || '').toUpperCase();
            const isCredit = typeStr.includes('CR') || (!typeStr.includes('DB') && parseFloat(amountRaw) >= 0);
            const ref = parts[4] || `CSV-${Date.now().toString().slice(-4)}-${i}`;

            if (num > 0) {
              parsed.push({
                date: dateStr.includes('-') ? dateStr : new Date().toISOString().split('T')[0],
                description: desc,
                amount: num,
                type: isCredit ? 'CR' : 'DB',
                ref,
              });
            }
          }
        }

        if (parsed.length === 0) {
          setParseError('Format CSV tidak dikenali. Pastikan kolom sesuai format: Tanggal, Deskripsi/Berita, Nominal, Tipe (CR/DB), No. Ref.');
        } else {
          setParsedRows(parsed);
        }
      } catch (err: any) {
        setParseError('Gagal memproses file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const res = StorageService.importCustomStatements(parsedRows);
        setLoading(false);
        onSuccess(res.count, `Berhasil mengimpor ${res.count} transaksi dari file CSV`);
        onClose();
      } catch (err: any) {
        setLoading(false);
        alert(err.message || 'Gagal mengimpor transaksi');
      }
    }, 500);
  };

  const handleParseAndImportPastedText = () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    try {
      const lines = pasteText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed: Array<{
        date: string;
        description: string;
        amount: number;
        type: 'CR' | 'DB';
        ref?: string;
      }> = [];

      lines.forEach((line, idx) => {
        // e.g. "18/08/2026 TRSF E-BANKING CR INV/2026/08/00004 PT MAKMUR JAYA LOGISTIK CR 17760000"
        const isDb = line.toUpperCase().includes(' DB ') || line.toUpperCase().endsWith(' DB');
        const numMatches = line.match(/(\d[\d.,]*\d|\d+)/g);
        let amount = 0;
        if (numMatches && numMatches.length > 0) {
          const lastNum = numMatches[numMatches.length - 1].replace(/\./g, '').replace(/,/g, '.');
          amount = Math.abs(parseFloat(lastNum) || 0);
        }

        parsed.push({
          date: new Date().toISOString().split('T')[0],
          description: line,
          amount: amount || 1000000,
          type: isDb ? 'DB' : 'CR',
          ref: `PST-${Date.now().toString().slice(-4)}-${idx + 1}`,
        });
      });

      const res = StorageService.importCustomStatements(parsed);
      setLoading(false);
      onSuccess(res.count, `Berhasil memproses & mengimpor ${res.count} baris mutasi bank`);
      onClose();
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Gagal memproses data teks');
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Tanggal,Deskripsi,Nominal,Tipe,Referensi\n' +
      '2026-08-20,TRSF CR PT TELKOM PRIMA NUSANTARA INV/2026/08/00001,30000000,CR,BCA-TRSF-001\n' +
      '2026-08-20,TRSF E-BANKING CR INV/2026/08/00004 PT MAKMUR JAYA,17760000,CR,BCA-TRSF-002\n' +
      '2026-08-21,BIAYA ADM PEMELIHARAAN REKENING GIRO,25000,DB,ADM-0821\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Rekening_Koran_BillingFlow.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Hubungkan & Impor Feed Bank</h3>
            <p className="text-xs font-normal text-slate-500">
              Sinkronisasi mutasi rekening koran atau impor file CSV/OFX untuk verifikasi otomatis
            </p>
          </div>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Koneksi Feed Bank Terintegrasi (Mock Live)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'csv'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Unggah File Rekening Koran (CSV / Excel)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Salin Teks Mutasi
          </button>
        </div>

        {/* Tab 1: Live / Preset Feeds */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Pilih kanal perbankan perusahaan yang terhubung untuk menarik mutasi pembayaran terbaru dan mencocokkannya dengan invoice yang belum lunas:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Preset 1: BCA */}
              <div
                onClick={() => setSelectedPreset('bca_live')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'bca_live'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-700 text-white font-black text-xs flex items-center justify-center tracking-tighter">
                      BCA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">BCA KlikBCA Bisnis (Live API)</h4>
                      <p className="text-[11px] text-slate-500">Giro 8830 1928 33 (PT BillingFlow)</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Connected</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Memuat transfer masuk untuk Invoice Makmur Jaya & Telkom
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    3 Mutasi baru siap ditarik & dicocokkan otomatis
                  </p>
                </div>
              </div>

              {/* Preset 2: Mandiri */}
              <div
                onClick={() => setSelectedPreset('mandiri_mcm')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'mandiri_mcm'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center tracking-tighter">
                      MDR
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Mandiri Cash Management (MCM)</h4>
                      <p className="text-[11px] text-slate-500">Giro 137 00 9823 4455</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Connected</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Memuat pelunasan Klinik Sehat Utama & Nusantara Digital
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    2 Mutasi baru siap sinkronisasi
                  </p>
                </div>
              </div>

              {/* Preset 3: Virtual Account */}
              <div
                onClick={() => setSelectedPreset('bca_va')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'bca_va'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center tracking-tighter">
                      VA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">BCA Virtual Account Billing</h4>
                      <p className="text-[11px] text-slate-500">Prefix 8830 1928 XXXX</p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">Real-time</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Auto-settlement tagihan PT Global Solusi Mandiri
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    1 Mutasi VA teridentifikasi
                  </p>
                </div>
              </div>

              {/* Preset 4: QRIS Batch */}
              <div
                onClick={() => setSelectedPreset('qris_batch')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPreset === 'qris_batch'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center tracking-tighter">
                      QRIS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">QRIS Dinamis Settlement Batch</h4>
                      <p className="text-[11px] text-slate-500">NMID 936000088192</p>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">Aggregator</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Batch settlement penerimaan pembayaran non-tunai
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Penerimaan e-wallet harian
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Sistem akan memindai nomor invoice & nama pelanggan secara otomatis setelah ditarik.
              </span>
              <Button
                size="sm"
                onClick={handleImportPreset}
                isLoading={loading}
                leftIcon={<Zap className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tarik Mutasi Sampel Sekarang
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: CSV Upload */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-600">
                Unggah file mutasi rekening koran dari internet banking (BCA, Mandiri, BNI, BRI, dll).
              </p>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template CSV
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Tarik & letakkan file CSV atau Excel di sini, atau
              </p>
              <label className="inline-block mt-2">
                <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  Pilih File dari Komputer
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-2">Mendukung format .CSV & .TXT</p>
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Pratinjau Hasil Pembacaan ({parsedRows.length} baris):</span>
                  <Badge variant="success" size="sm">Siap Diimpor</Badge>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl text-xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <th className="p-2">Tanggal</th>
                        <th className="p-2">Keterangan / Berita</th>
                        <th className="p-2">Tipe</th>
                        <th className="p-2 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 whitespace-nowrap text-slate-600">{r.date}</td>
                          <td className="p-2 text-slate-800 font-medium">{r.description}</td>
                          <td className="p-2">
                            <Badge variant={r.type === 'CR' ? 'success' : 'neutral'} size="sm">
                              {r.type}
                            </Badge>
                          </td>
                          <td className={`p-2 text-right font-mono font-semibold ${r.type === 'CR' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {formatRupiah(r.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={handleImportCSV}
                    isLoading={loading}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Impor {parsedRows.length} Transaksi ke Feed
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Paste Text */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Salin dan tempel baris mutasi rekening dari KlikBCA Bisnis, Livin Mandiri, atau email notifikasi bank:
            </p>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Contoh: 20/08/2026 TRSF CR INV/2026/08/00001 PT TELKOM CR 30000000"
              className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Sistem akan mendeteksi tanggal, teks berita, tipe (CR/DB), dan nominal secara otomatis.
              </span>
              <Button
                size="sm"
                onClick={handleParseAndImportPastedText}
                isLoading={loading}
                leftIcon={<Sparkles className="w-4 h-4 text-purple-200" />}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Proses & Impor Teks Mutasi
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
