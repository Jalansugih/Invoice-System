import React, { useMemo, useState } from 'react';
import { Costing, CostingBasis, CostingCategory, CostingInputType, CostingLine, Invoice } from '../../types';
import { StorageService, generateId } from '../../lib/storage';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wallet,
  ShieldAlert,
} from 'lucide-react';

interface Props { invoice: Invoice; }

const CATEGORY_LABELS: Record<CostingCategory, string> = {
  hpp: 'HPP Barang', logistics: 'Logistik', labor: 'Tenaga Kerja', operational: 'Operasional',
  sales: 'Penjualan', tax: 'Pajak', risk: 'Risiko', other: 'Lainnya',
};

const BASIS_LABELS: Record<CostingBasis, string> = {
  tender: 'Nilai tender', hpp: 'HPP barang', direct_cost: 'Biaya langsung',
};

function currencyValue(value: number) {
  return value > 0 ? new Intl.NumberFormat('id-ID').format(Math.round(value)) : '';
}

function parseCurrency(value: string) {
  const digits = value.replace(/[^0-9-]/g, '');
  return digits ? Number(digits) : 0;
}

const CurrencyField: React.FC<{ label?: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</label>}
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
      <input
        inputMode="numeric"
        value={currencyValue(value)}
        onChange={(e) => onChange(parseCurrency(e.target.value))}
        className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0"
      />
    </div>
  </div>
);

function seedLines(invoice: Invoice): CostingLine[] {
  const products = StorageService.getProducts();
  const hpp = invoice.items.reduce((sum, item) => {
    const product = item.productId ? products.find((p) => p.id === item.productId) : undefined;
    return sum + (Number(product?.costPrice) || 0) * (Number(item.quantity) || 0);
  }, 0);
  const taxRate = invoice.taxRate || StorageService.getOrganization().defaultTaxRate || 11;
  return [
    { id: generateId(), name: 'HPP / Harga Dasar Barang', category: 'hpp', inputType: 'fixed', value: hpp, basis: 'tender' },
    { id: generateId(), name: 'Ongkir / Pengiriman', category: 'logistics', inputType: 'fixed', value: 0, basis: 'tender' },
    { id: generateId(), name: 'Tenaga Kerja / Jasa', category: 'labor', inputType: 'fixed', value: 0, basis: 'tender' },
    { id: generateId(), name: 'Komisi', category: 'sales', inputType: 'percentage', value: 0, basis: 'tender' },
    { id: generateId(), name: 'Iklan / Marketing', category: 'sales', inputType: 'percentage', value: 0, basis: 'tender' },
    { id: generateId(), name: `Pajak (${taxRate}%)`, category: 'tax', inputType: 'percentage', value: taxRate, basis: 'tender' },
    { id: generateId(), name: 'Overhead / Administrasi', category: 'operational', inputType: 'percentage', value: 0, basis: 'tender' },
    { id: generateId(), name: 'Cadangan Risiko', category: 'risk', inputType: 'percentage', value: 0, basis: 'tender' },
  ];
}

export const CostingPanel: React.FC<Props> = ({ invoice }) => {
  const existing = StorageService.getCostingByInvoiceId(invoice.id);
  const [tenderValue, setTenderValue] = useState(existing?.tenderValue ?? invoice.grandTotal);
  const [targetMargin, setTargetMargin] = useState(existing?.targetMargin ?? 10);
  const [referenceNumber, setReferenceNumber] = useState(existing?.referenceNumber ?? invoice.poNumber ?? invoice.referenceNumber ?? '');
  const [title, setTitle] = useState(existing?.title ?? `Costing ${invoice.invoiceNumber}`);
  const [lines, setLines] = useState<CostingLine[]>(existing?.lines ?? seedLines(invoice));
  const [saved, setSaved] = useState(Boolean(existing));

  const calculation = useMemo(() => {
    const fixedDirect = lines.filter(l => ['hpp','logistics','labor'].includes(l.category) && l.inputType === 'fixed').reduce((s,l)=>s+Math.max(0,l.value),0);
    const hpp = lines.filter(l => l.category === 'hpp').reduce((s,l)=>s + (l.inputType === 'fixed' ? Math.max(0,l.value) : (Math.max(0,l.value) / 100) * tenderValue),0);
    const resolve = (line: CostingLine) => {
      if (line.inputType === 'fixed') return Math.max(0, line.value);
      const base = line.basis === 'tender' ? tenderValue : line.basis === 'hpp' ? hpp : fixedDirect;
      return Math.max(0, base * Math.max(0,line.value) / 100);
    };
    const resolved = lines.map(l => ({ ...l, amount: resolve(l) }));
    const total = resolved.reduce((s,l)=>s+l.amount,0);
    const profit = tenderValue-total;
    const margin = tenderValue > 0 ? profit/tenderValue*100 : 0;
    const markup = hpp > 0 ? profit/hpp*100 : 0;
    const tenderPct = lines.filter(l=>l.inputType==='percentage' && l.basis==='tender').reduce((s,l)=>s+Math.max(0,l.value),0);
    const fixedComponent = Math.max(0, total - (tenderValue*tenderPct/100));
    const bep = tenderPct < 100 ? fixedComponent / (1-tenderPct/100) : Infinity;
    const targetDenom = 1 - tenderPct/100 - targetMargin/100;
    const targetPrice = targetDenom > 0 ? fixedComponent / targetDenom : Infinity;
    const maxTotalCost = tenderValue * Math.max(0, 1-targetMargin/100);
    const nonHpp = Math.max(0, total-hpp);
    const maxHpp = Math.max(0, maxTotalCost-nonHpp);
    const status = profit < 0 ? 'rugi' : margin + 0.0001 < targetMargin ? 'tipis' : 'aman';
    return { resolved, hpp, total, profit, margin, markup, bep, targetPrice, maxHpp, status };
  }, [lines, tenderValue, targetMargin]);

  const updateLine = (id: string, patch: Partial<CostingLine>) => {
    setSaved(false);
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const removeLine = (id: string) => { setSaved(false); setLines(prev => prev.filter(l=>l.id!==id)); };
  const addLine = () => {
    setSaved(false);
    setLines(prev => [...prev, { id: generateId(), name: 'Biaya Baru', category: 'other', inputType: 'fixed', value: 0, basis: 'tender' }]);
  };
  const save = async () => {
    const costing: Omit<Costing,'id'|'createdAt'|'updatedAt'> & { id?: string } = {
      id: existing?.id,
      invoiceId: invoice.id,
      referenceNumber: referenceNumber || undefined,
      title: title || `Costing ${invoice.invoiceNumber}`,
      tenderValue: Math.max(0,tenderValue),
      targetMargin: Math.max(0,targetMargin),
      lines,
    };
    await StorageService.saveCosting(costing);
    setSaved(true);
  };

  const status = calculation.status;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"><Calculator className="w-5 h-5 text-blue-600"/><h3 className="text-base font-bold text-slate-900">Costing Tender & Analisis Profit</h3></div>
            <p className="text-xs text-slate-500">Masukkan biaya sebagai <b>Rp</b> atau <b>%</b>. Sistem langsung menghitung apakah tender aman atau berpotensi boncos.</p>
          </div>
          <div className="w-full lg:w-64"><CurrencyField label="Nilai Tender / Penawaran" value={tenderValue} onChange={(v)=>{setTenderValue(v);setSaved(false)}} /></div>
          <div className="w-full lg:w-48"><Input label="Target Margin (%)" type="number" min="0" max="99" step="0.01" value={targetMargin} onChange={(e)=>{setTargetMargin(Number(e.target.value)||0);setSaved(false)}} /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          <Metric label="Total Biaya" value={formatRupiah(calculation.total)} />
          <Metric label="HPP Barang" value={formatRupiah(calculation.hpp)} />
          <Metric label="Estimasi Laba" value={formatRupiah(calculation.profit)} tone={calculation.profit < 0 ? 'danger' : 'success'} />
          <Metric label="Margin" value={`${calculation.margin.toFixed(2)}%`} tone={calculation.margin < targetMargin ? 'warning' : 'success'} />
          <Metric label="Markup vs HPP" value={`${calculation.markup.toFixed(2)}%`} />
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${status==='rugi' ? 'border-rose-200 bg-rose-50' : status==='tipis' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <div className="flex items-start gap-3">
          {status==='rugi' ? <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5"/> : status==='tipis' ? <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5"/> : <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5"/>}
          <div className="flex-1"><p className="text-sm font-bold uppercase">{status==='rugi' ? 'BAHAYA — TENDER RUGI' : status==='tipis' ? 'PERLU DIWASPADAI — DI BAWAH TARGET' : 'AMAN — TARGET MARGIN TERCAPAI'}</p><p className="text-xs mt-0.5 text-slate-600">{status==='rugi' ? `Biaya lebih besar dari nilai tender sebesar ${formatRupiah(Math.abs(calculation.profit))}.` : status==='tipis' ? `Masih untung ${formatRupiah(calculation.profit)}, tetapi margin ${calculation.margin.toFixed(2)}% belum mencapai target ${targetMargin.toFixed(2)}%.` : `Estimasi laba ${formatRupiah(calculation.profit)} dengan margin ${calculation.margin.toFixed(2)}%.`}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Rincian Costing</h4><p className="text-[11px] text-slate-500">Setiap komponen boleh menggunakan nominal Rp atau persentase.</p></div><Button size="sm" variant="outline" onClick={addLine} leftIcon={<Plus className="w-4 h-4"/>}>Tambah Biaya</Button></div>
          <div className="p-4 space-y-2">
            {lines.map((line) => {
              const amount = calculation.resolved.find(r=>r.id===line.id)?.amount || 0;
              return <div key={line.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  <div className="md:col-span-3"><Input label="Komponen" value={line.name} onChange={e=>updateLine(line.id,{name:e.target.value})}/></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Kategori</label><select value={line.category} onChange={e=>updateLine(line.id,{category:e.target.value as CostingCategory})} className="w-full rounded-lg border border-slate-300 bg-white py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(CATEGORY_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Input</label><div className="flex rounded-lg border border-slate-300 overflow-hidden bg-white"><button type="button" onClick={()=>updateLine(line.id,{inputType:'fixed'})} className={`flex-1 py-2 text-[11px] font-bold ${line.inputType==='fixed'?'bg-blue-600 text-white':'text-slate-500'}`}>Rp</button><button type="button" onClick={()=>updateLine(line.id,{inputType:'percentage'})} className={`flex-1 py-2 text-[11px] font-bold ${line.inputType==='percentage'?'bg-blue-600 text-white':'text-slate-500'}`}>%</button></div></div>
                  <div className="md:col-span-2">{line.inputType==='fixed' ? <CurrencyField label="Nilai" value={line.value} onChange={v=>updateLine(line.id,{value:v})}/> : <Input label="Nilai %" type="number" min="0" step="0.01" value={line.value} onChange={e=>updateLine(line.id,{value:Number(e.target.value)||0})} />}</div>
                  <div className="md:col-span-2">{line.inputType==='percentage' ? <><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Dasar %</label><select value={line.basis} onChange={e=>updateLine(line.id,{basis:e.target.value as CostingBasis})} className="w-full rounded-lg border border-slate-300 bg-white py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(BASIS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></> : <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Terhitung</label><div className="py-2 text-sm font-bold text-slate-800">{formatRupiah(amount)}</div></div>}</div>
                  <div className="md:col-span-1 flex items-center justify-end gap-1"><div className="hidden md:block text-right mr-1"><div className="text-[10px] text-slate-400">Total</div><div className="text-xs font-bold text-slate-900">{formatRupiah(amount)}</div></div><button type="button" onClick={()=>removeLine(line.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4"/></button></div>
                </div>
              </div>;
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600"/> Batas Aman Tender</h4>
            <div className="mt-4 space-y-3 text-xs">
              <Row label="Harga BEP" value={Number.isFinite(calculation.bep) ? formatRupiah(calculation.bep) : 'Tidak terdefinisi'} />
              <Row label={`Harga target margin ${targetMargin}%`} value={Number.isFinite(calculation.targetPrice) ? formatRupiah(calculation.targetPrice) : 'Tidak terdefinisi'} />
              <Row label="HPP maksimal agar target tercapai" value={formatRupiah(calculation.maxHpp)} strong />
              <div className="pt-2 border-t border-slate-100"><p className="text-[11px] text-slate-500">Jika HPP aktual lebih tinggi dari batas tersebut, tender perlu dinegosiasikan atau biaya lain ditekan.</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-bold text-slate-900">Identitas Costing</h4>
            <div className="space-y-3 mt-3"><Input label="Nama / Judul" value={title} onChange={e=>{setTitle(e.target.value);setSaved(false)}}/><Input label="No. Referensi Tender / PO" value={referenceNumber} onChange={e=>{setReferenceNumber(e.target.value);setSaved(false)}} /></div>
            <div className="mt-4 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-500">{saved ? 'Costing tersimpan.' : 'Perubahan belum disimpan.'}</span><Button onClick={save} leftIcon={<Save className="w-4 h-4"/>}>Simpan Costing</Button></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"><div className="flex gap-2"><Wallet className="w-4 h-4 text-slate-500 shrink-0"/><p><b>Catatan:</b> persentase pajak, komisi, iklan, dan biaya lain dihitung otomatis sesuai dasar yang dipilih. Nilai Rp tetap bisa dimasukkan manual untuk biaya yang nominalnya sudah pasti.</p></div></div>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{label:string;value:string;tone?:'success'|'danger'|'warning'}> = ({label,value,tone}) => <div className="rounded-xl bg-white border border-slate-200 p-3"><div className="text-[10px] uppercase font-bold text-slate-400">{label}</div><div className={`text-sm font-bold mt-1 ${tone==='success'?'text-emerald-600':tone==='danger'?'text-rose-600':tone==='warning'?'text-amber-600':'text-slate-900'}`}>{value}</div></div>;
const Row: React.FC<{label:string;value:string;strong?:boolean}> = ({label,value,strong}) => <div className="flex items-center justify-between gap-3"><span className="text-slate-500">{label}</span><span className={strong?'font-bold text-blue-700':'font-semibold text-slate-900'}>{value}</span></div>;
