import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import { Invoice } from '../../types';
import { Button } from '../ui/Button';
import { calculateCosting, CostBasis, CostComponentInput, CostInputType } from '../../lib/costingEngine';
import { SupabaseService } from '../../lib/supabaseService';
import { StorageService } from '../../lib/storage';
import { formatRupiah } from '../../lib/utils';

interface CostingProfitPanelProps {
  invoice: Invoice;
}

const DEFAULT_COMPONENTS: CostComponentInput[] = [
  { id: 'hpp', name: 'HPP / Harga Dasar Barang', inputType: 'rp', inputValue: 0, sortOrder: 1 },
  { id: 'ongkir', name: 'Ongkir', inputType: 'rp', inputValue: 0, sortOrder: 2 },
  { id: 'tenaga-kerja', name: 'Tenaga Kerja', inputType: 'rp', inputValue: 0, sortOrder: 3 },
  { id: 'komisi', name: 'Komisi', inputType: 'percent', inputValue: 0, basis: 'tender', sortOrder: 4 },
  { id: 'iklan', name: 'Iklan', inputType: 'percent', inputValue: 0, basis: 'tender', sortOrder: 5 },
  { id: 'pajak', name: 'Pajak', inputType: 'percent', inputValue: 0, basis: 'tender', sortOrder: 6 },
  { id: 'overhead', name: 'Overhead', inputType: 'percent', inputValue: 0, basis: 'direct_cost', sortOrder: 7 },
  { id: 'risiko', name: 'Cadangan Risiko', inputType: 'percent', inputValue: 0, basis: 'tender', sortOrder: 8 },
];

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

const parseNumber = (value: string) => {
  const raw = value.replace(/[^0-9.,-]/g, '').trim();
  if (!raw) return 0;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : (raw.split('.').length > 2 ? raw.replace(/\./g, '') : raw);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const formatPercent = (value: number | null) => value === null || !Number.isFinite(value) ? '-' : `${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

export const CostingProfitPanel: React.FC<CostingProfitPanelProps> = ({ invoice }) => {
  const [hppBarang, setHppBarang] = useState(0);
  const [targetMargin, setTargetMargin] = useState(10);
  const [components, setComponents] = useState<CostComponentInput[]>(DEFAULT_COMPONENTS.map((c) => ({ ...c })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const nilaiTender = Number(invoice.grandTotal) || 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const saved = await SupabaseService.fetchCosting(invoice.id);
        if (cancelled) return;
        if (saved) {
          setHppBarang(Number(saved.hppBarang) || 0);
          setTargetMargin(Number(saved.targetMargin) || 10);
          setComponents(saved.components.map((c) => ({
            id: c.id,
            name: c.name,
            inputType: c.inputType,
            inputValue: Number(c.inputValue) || 0,
            basis: c.basis,
            sortOrder: c.sortOrder,
            isActive: c.isActive,
          })));
          // Older saved costings may not have an explicit HPP component.
          setComponents((current) => current.some((c) => c.id === 'hpp') ? current.map((c) => c.id === 'hpp' ? { ...c, inputValue: Number(saved.hppBarang) || 0 } : c) : [{ ...DEFAULT_COMPONENTS[0], inputValue: Number(saved.hppBarang) || 0 }, ...current]);
          setSavedAt(saved.updatedAt || saved.createdAt || null);
        } else {
          setHppBarang(0);
          setTargetMargin(10);
          setComponents(DEFAULT_COMPONENTS.map((c) => ({ ...c })));
          setSavedAt(null);
        }
      } catch (e: any) {
        if (!cancelled) alert(`Gagal memuat Costing: ${e?.message || 'Terjadi kesalahan.'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [invoice.id]);

  const calculation = useMemo(() => calculateCosting({
    nilaiTender,
    hppBarang,
    komponenBiaya: components,
    targetMargin,
  }), [nilaiTender, hppBarang, components, targetMargin]);

  const updateComponent = (index: number, patch: Partial<CostComponentInput>) => {
    setComponents((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
    const item = components[index];
    if (item?.id === 'hpp' && patch.inputValue !== undefined) setHppBarang(Number(patch.inputValue) || 0);
  };

  const addComponent = () => {
    setComponents((current) => [...current, {
      id: `custom-${Date.now()}`,
      name: 'Biaya Lainnya',
      inputType: 'rp',
      inputValue: 0,
      sortOrder: current.length + 1,
      isActive: true,
    }]);
  };

  const removeComponent = (index: number) => {
    if (components[index]?.id === 'hpp') {
      alert('Komponen HPP / Harga Dasar Barang wajib ada pada Costing v1.');
      return;
    }
    setComponents((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (nilaiTender < 0 || hppBarang < 0) {
      alert('Nilai tender dan HPP tidak boleh negatif.');
      return;
    }
    if (targetMargin < 0 || targetMargin >= 100) {
      alert('Target Margin harus di antara 0% dan kurang dari 100%.');
      return;
    }
    if (components.some((c) => c.inputValue < 0 || (c.inputType === 'percent' && c.inputValue > 100))) {
      alert('Nilai biaya tidak valid. Persentase harus 0% sampai 100%.');
      return;
    }

    setSaving(true);
    try {
      const saved = await SupabaseService.saveCosting({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        transactionDate: invoice.issueDate,
        nilaiTender,
        hppBarang,
        targetMargin,
        components: components.map((c, index) => ({ ...c, sortOrder: index + 1, isActive: true })),
        result: calculation,
      });
      if (!saved) throw new Error('Costing belum tersimpan ke Supabase. Pastikan sesi login, tenant, migration v21, dan RLS sudah aktif.');
      setSavedAt(saved.updatedAt || saved.createdAt || new Date().toISOString());
      StorageService.notifyExternalChange();
    } catch (e: any) {
      alert(`Gagal menyimpan Costing: ${e?.message || 'Terjadi kesalahan.'}`);
    } finally {
      setSaving(false);
    }
  };

  const status = calculation.status;
  const statusMeta = status === 'safe'
    ? { label: 'AMAN — Target Margin Tercapai', icon: CheckCircle2, box: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
    : status === 'danger'
      ? { label: 'BAHAYA — TENDER RUGI', icon: AlertTriangle, box: 'border-rose-200 bg-rose-50 text-rose-800' }
      : { label: 'PERLU DIWASPADAI — Di Bawah Target', icon: AlertTriangle, box: 'border-amber-200 bg-amber-50 text-amber-800' };
  const StatusIcon = statusMeta.icon;

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Memuat Costing...</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Costing & Profit</h3>
            <p className="text-xs text-slate-500">Anti-Boncos Engine untuk {invoice.invoiceNumber} · {invoice.customerName}</p>
          </div>
          {savedAt && <span className="text-[11px] text-slate-400">Tersimpan {new Date(savedAt).toLocaleString('id-ID')}</span>}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase text-slate-500">Nilai Tender / Invoice</p><p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(nilaiTender)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase text-slate-500">HPP Barang</p><p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(hppBarang)}</p><p className="mt-1 text-[10px] text-slate-400">Diubah pada komponen HPP di bawah.</p></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-bold text-slate-900">Komponen Biaya</h4><p className="text-xs text-slate-500">Pilih Rp atau % dan tentukan basis untuk biaya persentase.</p></div><Button variant="outline" size="sm" onClick={addComponent} leftIcon={<Plus className="h-4 w-4" />}>Tambah Komponen</Button></div>
        <div className="mt-4 space-y-3">
          {components.map((component, index) => (
            <div key={component.id || index} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[1.5fr_90px_1fr_1fr_42px] md:items-center">
              <input className={inputClass} value={component.name} onChange={(e) => updateComponent(index, { name: e.target.value })} />
              <select className={inputClass} value={component.inputType} onChange={(e) => updateComponent(index, { inputType: e.target.value as CostInputType, basis: e.target.value === 'percent' ? (component.basis || 'tender') : null })}>
                <option value="rp">Rp</option><option value="percent">%</option>
              </select>
              <input className={inputClass} inputMode="decimal" value={component.inputValue || ''} onChange={(e) => updateComponent(index, { inputValue: parseNumber(e.target.value) })} placeholder={component.inputType === 'percent' ? '0%' : '0'} />
              {component.inputType === 'percent' ? (
                <select className={inputClass} value={component.basis || 'tender'} onChange={(e) => updateComponent(index, { basis: e.target.value as CostBasis })}>
                  <option value="tender">Basis: Nilai Tender</option><option value="hpp">Basis: HPP Barang</option><option value="direct_cost">Basis: Biaya Langsung</option>
                </select>
              ) : <div className="text-xs text-slate-400">Nominal langsung</div>}
              <button type="button" disabled={component.id === 'hpp'} className={`flex h-9 w-9 items-center justify-center rounded-lg ${component.id === 'hpp' ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`} onClick={() => removeComponent(index)} aria-label="Hapus komponen"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block max-w-xs"><span className="text-xs font-bold text-slate-700">Target Margin</span><div className="mt-2 flex items-center gap-2"><input className={inputClass} inputMode="decimal" value={targetMargin} onChange={(e) => setTargetMargin(parseNumber(e.target.value))} /><span className="font-semibold text-slate-500">%</span></div></label>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Metric label="Nilai Tender" value={formatRupiah(calculation.nilaiTender)} />
          <Metric label="HPP Barang" value={formatRupiah(calculation.hppBarang)} />
          <Metric label="Biaya Langsung" value={formatRupiah(calculation.biayaLangsung)} />
          <Metric label="Total Biaya" value={formatRupiah(calculation.totalBiaya)} />
          <Metric label="Estimasi Laba" value={formatRupiah(calculation.estimasiLaba)} />
          <Metric label="Margin" value={formatPercent(calculation.marginPersen)} />
          <Metric label="Markup vs HPP" value={formatPercent(calculation.markupPersen)} />
          <Metric label="Harga BEP" value={calculation.hargaBep === null ? '-' : formatRupiah(calculation.hargaBep)} />
          <Metric label="Harga Target" value={calculation.hargaTarget === null ? '-' : formatRupiah(calculation.hargaTarget)} />
          <Metric label="HPP Maksimal" value={calculation.hppMaksimal === null ? '-' : formatRupiah(Math.max(0, calculation.hppMaksimal))} />
        </div>
      </div>

      <div className={`rounded-2xl border p-5 ${statusMeta.box}`}>
        <div className="flex items-start gap-3"><StatusIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{statusMeta.label}</p><p className="mt-1 text-xs opacity-80">Margin aktual {formatPercent(calculation.marginPersen)} · Target {formatPercent(calculation.targetMargin)}</p></div></div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-slate-400">Basis % disimpan bersama Costing agar perhitungan dapat direproduksi.</p>
        <Button onClick={handleSave} disabled={saving} leftIcon={<Save className="h-4 w-4" />}>{saving ? 'Menyimpan...' : 'Simpan Costing'}</Button>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p></div>
);
