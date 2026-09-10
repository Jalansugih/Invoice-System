import React, { useMemo, useState } from 'react';
import { Invoice, CostingComponent } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah } from '../../lib/utils';
import {
  calculateCosting,
  defaultCostingComponents,
  statusLabel,
  type CostingStatus,
  type CostInputType,
  type CostBasis,
} from '../../lib/costingCalc';
import { Button } from '../ui/Button';
import {
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Target,
  TrendingUp,
  Calculator,
  RotateCcw,
} from 'lucide-react';

interface CostingPanelProps {
  invoice: Invoice;
}

type DraftComponent = CostingComponent & { key: string };

let keySeq = 0;
const nextKey = () => `k${Date.now()}_${keySeq++}`;

function toDraft(components: CostingComponent[]): DraftComponent[] {
  return components.map((c) => ({ ...c, key: nextKey() }));
}

const statusTheme: Record<
  CostingStatus,
  { wrap: string; badge: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  AMAN: {
    wrap: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    Icon: ShieldCheck,
  },
  WASPADA: {
    wrap: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-500 text-white',
    Icon: AlertTriangle,
  },
  BAHAYA: {
    wrap: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-600 text-white',
    Icon: ShieldAlert,
  },
};

export const CostingPanel: React.FC<CostingPanelProps> = ({ invoice }) => {
  const existing = StorageService.getCostingByInvoiceId(invoice.id);

  const [tenderValue, setTenderValue] = useState<number>(
    existing?.tenderValue ?? invoice.grandTotal ?? 0
  );
  const [hppBarang, setHppBarang] = useState<number>(existing?.hppBarang ?? 0);
  const [targetMargin, setTargetMargin] = useState<number>(existing?.targetMargin ?? 15);
  const [components, setComponents] = useState<DraftComponent[]>(
    toDraft(existing?.components?.length ? existing.components : defaultCostingComponents() as CostingComponent[])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(existing?.updatedAt ?? null);

  const result = useMemo(
    () =>
      calculateCosting({
        nilaiTender: tenderValue,
        hppBarang,
        targetMargin,
        komponenBiaya: components,
      }),
    [tenderValue, hppBarang, targetMargin, components]
  );

  const theme = statusTheme[result.status];

  const updateComponent = (key: string, patch: Partial<DraftComponent>) => {
    setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const removeComponent = (key: string) => {
    setComponents((prev) => prev.filter((c) => c.key !== key));
  };

  const addComponent = () => {
    setComponents((prev) => [
      ...prev,
      {
        key: nextKey(),
        name: '',
        inputType: 'rp',
        value: 0,
        isDirectCost: false,
        isActive: true,
        sortOrder: prev.length,
      },
    ]);
  };

  const resetToDefaults = () => {
    setComponents(toDraft(defaultCostingComponents() as CostingComponent[]));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = StorageService.saveCosting({
        invoiceId: invoice.id,
        customerId: (invoice as any).customerId,
        customerName: invoice.customerName,
        transactionDate: invoice.invoiceDate,
        tenderValue,
        hppBarang,
        targetMargin,
        components: components.map(({ key, ...c }, idx) => ({ ...c, sortOrder: idx })),
      });
      setSavedAt(saved.updatedAt);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan analisis costing.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status banner + headline metrics */}
      <div className={`rounded-2xl border p-5 ${theme.wrap}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${theme.badge}`}>
              <theme.Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wide text-slate-500">
                Status Kesehatan Tender
              </p>
              <p className="text-lg font-extrabold text-slate-900">{statusLabel(result.status)}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[11px] uppercase font-bold tracking-wide text-slate-500">
                Estimasi Laba Bersih
              </p>
              <p
                className={`text-2xl font-extrabold font-mono ${
                  result.estimasiLaba < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatRupiah(result.estimasiLaba)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase font-bold tracking-wide text-slate-500">
                Margin Bersih
              </p>
              <p
                className={`text-2xl font-extrabold font-mono ${
                  result.marginPersen < 0
                    ? 'text-rose-600'
                    : result.marginPersen < targetMargin
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {result.marginPersen.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Inputs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Base numbers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Dasar Perhitungan</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NumberField
                label="Nilai Tender / Jual"
                value={tenderValue}
                onChange={setTenderValue}
                prefix="Rp"
              />
              <NumberField
                label="HPP Barang (Modal)"
                value={hppBarang}
                onChange={setHppBarang}
                prefix="Rp"
              />
              <NumberField
                label="Target Margin"
                value={targetMargin}
                onChange={setTargetMargin}
                suffix="%"
                step={0.5}
              />
            </div>
          </div>

          {/* Cost components */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Komponen Biaya Tambahan</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-slate-600"
                >
                  Reset Default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addComponent}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Tambah
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-1 text-[10px] uppercase font-bold text-slate-400">
                <div className="col-span-4">Nama Biaya</div>
                <div className="col-span-2">Tipe</div>
                <div className="col-span-2">Nilai</div>
                <div className="col-span-3">Basis %</div>
                <div className="col-span-1 text-center">Aksi</div>
              </div>

              {components.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada komponen biaya. Klik &quot;Tambah&quot; untuk memasukkan biaya seperti
                  ongkir, komisi, pajak, dsb.
                </p>
              )}

              {components.map((c, index) => {
                // calculateCosting preserves the order of active components, and
                // every draft here is active, so index maps 1:1 to the result.
                const computed = result.components[index];
                return (
                  <div
                    key={c.key}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-xl p-2 border border-slate-100"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <input
                        type="text"
                        value={c.name}
                        placeholder="Nama biaya"
                        onChange={(e) => updateComponent(c.key, { name: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <label className="flex items-center gap-1.5 mt-1 px-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!c.isDirectCost}
                          onChange={(e) => updateComponent(c.key, { isDirectCost: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        <span className="text-[10px] text-slate-500">Biaya langsung</span>
                      </label>
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <select
                        value={c.inputType}
                        onChange={(e) =>
                          updateComponent(c.key, { inputType: e.target.value as CostInputType })
                        }
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="rp">Rp</option>
                        <option value="percent">%</option>
                      </select>
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <input
                        type="number"
                        value={Number.isFinite(c.value) ? c.value : 0}
                        min={0}
                        onChange={(e) => updateComponent(c.key, { value: Number(e.target.value) })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="col-span-3 md:col-span-3">
                      {c.inputType === 'percent' ? (
                        <select
                          value={c.basis || 'nilai_tender'}
                          onChange={(e) =>
                            updateComponent(c.key, { basis: e.target.value as CostBasis })
                          }
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="nilai_tender">dari Nilai Tender</option>
                          <option value="hpp">dari HPP</option>
                          <option value="biaya_langsung">dari Biaya Langsung</option>
                        </select>
                      ) : (
                        <span className="block text-right text-[11px] font-mono text-slate-500 pr-1">
                          {computed ? formatRupiah(computed.computedAmount) : '-'}
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeComponent(c.key)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        aria-label={`Hapus ${c.name || 'komponen'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {c.inputType === 'percent' && computed && (
                      <div className="col-span-12 text-right text-[10px] font-mono text-slate-400 -mt-1 pr-1">
                        = {formatRupiah(computed.computedAmount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Ringkasan Biaya</h3>
            <SummaryRow label="HPP Barang" value={formatRupiah(result.hppBarang)} />
            <SummaryRow label="Biaya Langsung" value={formatRupiah(result.biayaLangsung)} />
            <SummaryRow
              label="Total Seluruh Biaya"
              value={formatRupiah(result.totalBiaya)}
              strong
            />
            <div className="border-t border-slate-100 pt-3">
              <SummaryRow
                label="Estimasi Laba"
                value={formatRupiah(result.estimasiLaba)}
                valueClass={result.estimasiLaba < 0 ? 'text-rose-600' : 'text-emerald-700'}
                strong
              />
              <SummaryRow
                label="Markup dari HPP"
                value={result.markupPersen === null ? '-' : `${result.markupPersen.toFixed(2)}%`}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold">Analisis Harga (Anti-Boncos)</h3>
            </div>
            <PriceRow
              label="Harga BEP (Balik Modal)"
              hint="Laba = 0"
              value={formatRupiah(result.hargaBep)}
            />
            <PriceRow
              label={`Harga Target (margin ${targetMargin}%)`}
              hint="Harga jual ideal"
              value={result.hargaTarget === null ? 'Tidak tercapai' : formatRupiah(result.hargaTarget)}
              accent
            />
            <PriceRow
              label="HPP Maksimal"
              hint="Batas modal aman"
              value={result.hppMaksimal === null ? '-' : formatRupiah(result.hppMaksimal)}
            />
            {result.hargaTarget !== null && tenderValue < result.hargaTarget && (
              <div className="flex items-start gap-2 text-[11px] bg-amber-500/15 text-amber-200 rounded-lg p-2.5">
                <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Naikkan harga jual sebesar{' '}
                  <strong className="font-mono">
                    {formatRupiah(result.hargaTarget - tenderValue)}
                  </strong>{' '}
                  untuk mencapai target margin.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            {savedAt && (
              <span className="text-[10px] text-slate-400">
                Tersimpan {new Date(savedAt).toLocaleString('id-ID')}
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Analisis'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}> = ({ label, value, onChange, prefix, suffix, step }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-slate-500">{label}</span>
    <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-200 overflow-hidden">
      {prefix && <span className="px-2 text-xs text-slate-400 shrink-0">{prefix}</span>}
      <input
        type="number"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-2 py-2 text-sm font-mono text-right focus:outline-none"
      />
      {suffix && <span className="px-2 text-xs text-slate-400 shrink-0">{suffix}</span>}
    </div>
  </label>
);

const SummaryRow: React.FC<{
  label: string;
  value: string;
  strong?: boolean;
  valueClass?: string;
}> = ({ label, value, strong, valueClass }) => (
  <div className="flex items-center justify-between">
    <span className={`text-xs ${strong ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
      {label}
    </span>
    <span
      className={`font-mono text-sm ${valueClass || 'text-slate-800'} ${
        strong ? 'font-extrabold' : 'font-medium'
      }`}
    >
      {value}
    </span>
  </div>
);

const PriceRow: React.FC<{
  label: string;
  hint: string;
  value: string;
  accent?: boolean;
}> = ({ label, hint, value, accent }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-semibold truncate">{label}</p>
      <p className="text-[10px] text-slate-400">{hint}</p>
    </div>
    <span
      className={`font-mono font-bold text-right shrink-0 ${
        accent ? 'text-blue-300 text-lg' : 'text-white'
      }`}
    >
      {value}
    </span>
  </div>
);
