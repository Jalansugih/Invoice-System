import React, { useMemo, useRef, useState } from 'react';
import { Product } from '../../types';
import { StorageService } from '../../lib/storage';
import { exportToCSV, parseCSV } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from 'lucide-react';

export interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  taxRate: number;
  description: string;
  isActive: boolean;
  errors: string[];
  isDuplicate: boolean; // kode sudah ada di master produk saat ini
}

type Step = 'upload' | 'preview' | 'done';

// Kolom yang diterima di file CSV. Header dicocokkan tanpa memandang huruf
// besar/kecil, dan beberapa alias umum didukung supaya file dari sumber lain
// (mis. sudah pernah export dari sini, atau bikin manual di Excel) tetap jalan.
const HEADER_ALIASES: Record<string, string[]> = {
  code: ['kode item', 'kode', 'code', 'sku'],
  name: ['nama item', 'nama', 'name', 'nama produk'],
  category: ['kategori', 'category'],
  unit: ['satuan', 'unit'],
  price: ['harga satuan', 'harga', 'price'],
  taxRate: ['ppn (%)', 'ppn', 'tax', 'tax rate', 'pajak'],
  description: ['deskripsi', 'description', 'keterangan'],
  isActive: ['status', 'aktif', 'is active'],
};

function findValue(row: Record<string, string>, field: keyof typeof HEADER_ALIASES): string {
  const normalizedRow: Record<string, string> = {};
  Object.keys(row).forEach((k) => {
    normalizedRow[k.trim().toLowerCase()] = row[k];
  });
  for (const alias of HEADER_ALIASES[field]) {
    if (normalizedRow[alias] !== undefined) return normalizedRow[alias];
  }
  return '';
}

function parsePrice(raw: string): number {
  if (!raw) return NaN;
  // Buang "Rp", spasi, dan pemisah ribuan titik; ubah koma desimal (gaya ID) jadi titik.
  const cleaned = raw
    .replace(/rp/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

function parseActive(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return true; // default aktif kalau kolom status kosong
  return ['aktif', 'active', 'true', '1', 'ya', 'yes'].includes(v);
}

const TEMPLATE_ROWS = [
  {
    'Kode Item': '',
    'Nama Item': 'Jasa Instalasi Jaringan',
    Kategori: 'Jasa Profesional',
    Satuan: 'Paket',
    'Harga Satuan': 1500000,
    'PPN (%)': 11,
    Deskripsi: 'Instalasi & konfigurasi jaringan kantor',
    Status: 'Aktif',
  },
  {
    'Kode Item': '',
    'Nama Item': 'Lisensi Software Bulanan',
    Kategori: 'Lisensi',
    Satuan: 'Bulan',
    'Harga Satuan': 250000,
    'PPN (%)': 11,
    Deskripsi: '',
    Status: 'Aktif',
  },
];

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [result, setResult] = useState<{ created: number; updated: number; failed: number }>({
    created: 0,
    updated: 0,
    failed: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingProducts = useMemo(() => StorageService.getProducts(), [isOpen]);

  const resetState = () => {
    setStep('upload');
    setFileName('');
    setRows([]);
    setIsImporting(false);
    setImportProgress(0);
    setResult({ created: 0, updated: 0, failed: 0 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    exportToCSV('Template_Import_Produk', TEMPLATE_ROWS);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const parsed = parseCSV(text);

      const existingCodes = new Set(
        existingProducts.map((p) => p.code.trim().toLowerCase()).filter(Boolean)
      );

      const parsedRows: ParsedRow[] = parsed.map((raw, idx) => {
        const errors: string[] = [];
        const code = findValue(raw, 'code').trim();
        const name = findValue(raw, 'name').trim();
        const category = findValue(raw, 'category').trim() || 'Umum';
        const unit = findValue(raw, 'unit').trim() || 'Unit';
        const priceRaw = findValue(raw, 'price');
        const price = parsePrice(priceRaw);
        const taxRateRaw = findValue(raw, 'taxRate');
        const taxRate = taxRateRaw ? parseFloat(taxRateRaw.replace(',', '.').replace('%', '')) : 0;
        const description = findValue(raw, 'description').trim();
        const isActive = parseActive(findValue(raw, 'isActive'));

        if (!name) errors.push('Nama item wajib diisi');
        if (priceRaw && isNaN(price)) errors.push('Harga satuan tidak valid');
        if (!priceRaw) errors.push('Harga satuan wajib diisi');
        if (taxRateRaw && isNaN(taxRate)) errors.push('PPN (%) tidak valid');

        return {
          rowNumber: idx + 2, // +2: baris 1 = header, data mulai baris 2
          code,
          name,
          category,
          unit,
          price: isNaN(price) ? 0 : price,
          taxRate: isNaN(taxRate) ? 0 : taxRate,
          description,
          isActive,
          errors,
          isDuplicate: !!code && existingCodes.has(code.toLowerCase()),
        };
      });

      setRows(parsedRows);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);
  const duplicateCount = validRows.filter((r) => r.isDuplicate).length;

  const handleImport = async () => {
    setIsImporting(true);
    let created = 0;
    let updated = 0;
    let failed = 0;

    // Sengaja sequential (bukan Promise.all) - saveProduct() mereservasi nomor
    // urut kode produk secara atomik satu per satu; kalau diparalel, reservasi
    // sequence & pembaruan storage lokal bisa saling menimpa antar baris.
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      try {
        const existing = r.code
          ? existingProducts.find((p) => p.code.trim().toLowerCase() === r.code.trim().toLowerCase())
          : undefined;

        await StorageService.saveProduct({
          id: existing?.id,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          price: r.price,
          taxRate: r.taxRate,
          description: r.description,
          isActive: r.isActive,
        });

        if (existing) updated++;
        else created++;
      } catch (err) {
        console.error('Gagal import baris', r.rowNumber, err);
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setResult({ created, updated, failed });
    setIsImporting(false);
    setStep('done');
    onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          Import Massal Produk & Jasa
        </span>
      }
      subtitle="Tambah atau perbarui banyak item master produk sekaligus dari file CSV"
      maxWidth="3xl"
      footer={
        step === 'preview' ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                setStep('upload');
                setRows([]);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Pilih file lain
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={isImporting}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={validRows.length === 0 || isImporting}
                leftIcon={isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              >
                {isImporting
                  ? `Mengimpor... ${importProgress}%`
                  : `Import ${validRows.length} Item`}
              </Button>
            </div>
          </div>
        ) : step === 'done' ? (
          <div className="flex justify-end w-full">
            <Button size="sm" onClick={handleClose}>
              Selesai
            </Button>
          </div>
        ) : undefined
      }
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Klik untuk pilih file, atau tarik file CSV ke sini
            </p>
            <p className="text-xs text-slate-400 mt-1">Format .csv, hasil export Excel/Google Sheets juga bisa</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Format kolom yang dibaca:</p>
            <p>
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Nama Item</span>{' '}
              dan{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Harga Satuan</span>{' '}
              wajib diisi. Kolom lain (Kode Item, Kategori, Satuan, PPN (%), Deskripsi, Status) opsional.
            </p>
            <p>
              Jika <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Kode Item</span>{' '}
              sudah ada di master produk saat ini, datanya akan <span className="font-semibold">diperbarui</span>{' '}
              (bukan dibuat duplikat). Kalau kosong, kode baru dibuat otomatis.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold mt-1"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template CSV
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">
              File: <span className="font-semibold text-slate-700">{fileName}</span>
            </span>
            <Badge variant="success" size="sm">
              {validRows.length} valid
            </Badge>
            {duplicateCount > 0 && (
              <Badge variant="default" size="sm">
                {duplicateCount} akan diperbarui (kode sudah ada)
              </Badge>
            )}
            {invalidRows.length > 0 && (
              <Badge variant="danger" size="sm">
                {invalidRows.length} bermasalah (dilewati)
              </Badge>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="py-2 px-3">Baris</th>
                  <th className="py-2 px-3">Nama Item</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3">Satuan</th>
                  <th className="py-2 px-3 text-right">Harga</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.rowNumber} className={r.errors.length > 0 ? 'bg-rose-50/60' : ''}>
                    <td className="py-2 px-3 text-slate-400">{r.rowNumber}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {r.name || <span className="text-rose-500 italic">(kosong)</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{r.category}</td>
                    <td className="py-2 px-3 text-slate-600">{r.unit}</td>
                    <td className="py-2 px-3 text-right text-slate-700">{r.price.toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3">
                      {r.errors.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {r.errors.join(', ')}
                        </span>
                      ) : r.isDuplicate ? (
                        <span className="text-amber-600 font-medium">Perbarui</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Baru
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Import selesai</p>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="success" size="sm">{result.created} item baru</Badge>
            <Badge variant="default" size="sm">{result.updated} diperbarui</Badge>
            {result.failed > 0 && <Badge variant="danger" size="sm">{result.failed} gagal</Badge>}
          </div>
        </div>
      )}
    </Modal>
  );
};
