/**
 * COSTING & PROFIT ENGINE ("Anti-Boncos Engine")
 * ------------------------------------------------
 * Satu-satunya sumber kebenaran untuk perhitungan costing/profitabilitas
 * sebuah tender/invoice. Sengaja dibuat PURE (tanpa React, tanpa localStorage,
 * tanpa query database) supaya deterministik & mudah dites.
 *
 * Input:
 *   - nilaiTender  : nilai jual/invoice/tender
 *   - hppBarang    : total harga dasar barang/produk (v1: input manual)
 *   - komponenBiaya: daftar komponen biaya tambahan (Rp atau %)
 *   - targetMargin : target margin bersih dalam persen (mis. 10 = 10%)
 *
 * Output: ringkasan lengkap + analisis harga + status kesehatan tender.
 *
 * Catatan rumus persentase: komponen % yang berbasis "Nilai Tender" ikut
 * berubah mengikuti harga jual, sehingga BEP & harga target TIDAK boleh
 * dihitung dengan penjumlahan biaya sederhana. Kita pisahkan biaya menjadi
 * FIXED (tidak bergerak mengikuti harga) dan VARIABEL (persentase dari Nilai
 * Tender), lalu:
 *
 *   HargaBEP     = BiayaTetap / (1 - totalRateVariabel)
 *   HargaTarget  = BiayaTetap / (1 - totalRateVariabel - targetMargin)
 *
 * Komponen % yang berbasis HPP atau Biaya Langsung diperlakukan sebagai biaya
 * tetap (dievaluasi pada nilai input saat ini) demi reproducibility v1.
 */

export type CostInputType = 'rp' | 'percent';
export type CostBasis = 'nilai_tender' | 'hpp' | 'biaya_langsung';

export interface CostingComponentInput {
  id?: string;
  name: string;
  inputType: CostInputType;
  /** Nominal rupiah bila inputType='rp', atau angka persen (mis. 3 = 3%) bila 'percent'. */
  value: number;
  /** Wajib bila inputType='percent'. Diabaikan bila 'rp'. */
  basis?: CostBasis;
  /** true = dihitung sebagai bagian dari "Biaya Langsung" (mis. ongkir, tenaga kerja). */
  isDirectCost?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export type CostingStatus = 'AMAN' | 'WASPADA' | 'BAHAYA';

export interface CostingComponentResult extends CostingComponentInput {
  /** Nominal rupiah hasil perhitungan komponen ini (sudah dibulatkan). */
  computedAmount: number;
}

export interface CostingResult {
  nilaiTender: number;
  hppBarang: number;
  biayaLangsung: number;
  totalBiaya: number;
  estimasiLaba: number;
  marginPersen: number;
  /** null bila HPP = 0 (markup tidak terdefinisi). */
  markupPersen: number | null;
  hargaBep: number;
  /** null bila secara matematis tidak tercapai (rate variabel + margin >= 100%). */
  hargaTarget: number | null;
  /** null bila tidak terdefinisi. */
  hppMaksimal: number | null;
  targetMargin: number;
  status: CostingStatus;
  components: CostingComponentResult[];
}

/** Pembulatan ke rupiah penuh, aman dari galat floating point. */
export function roundRupiah(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/** Pembulatan persentase ke 2 desimal, aman dari NaN/Infinity. */
export function roundPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface CalculateCostingParams {
  nilaiTender: number;
  hppBarang: number;
  komponenBiaya: CostingComponentInput[];
  targetMargin: number;
}

/**
 * Menghitung nominal satu komponen biaya berdasarkan tipe & basisnya.
 * `biayaLangsungBase` dipakai hanya untuk komponen % berbasis 'biaya_langsung'.
 */
function computeComponentAmount(
  c: CostingComponentInput,
  nilaiTender: number,
  hppBarang: number,
  biayaLangsungBase: number
): number {
  const value = Math.max(0, num(c.value));
  if (c.inputType === 'rp') {
    return roundRupiah(value);
  }
  // percent
  const rate = value / 100;
  let base = 0;
  switch (c.basis) {
    case 'hpp':
      base = Math.max(0, hppBarang);
      break;
    case 'biaya_langsung':
      base = Math.max(0, biayaLangsungBase);
      break;
    case 'nilai_tender':
    default:
      base = Math.max(0, nilaiTender);
      break;
  }
  return roundRupiah(rate * base);
}

export function calculateCosting(params: CalculateCostingParams): CostingResult {
  const nilaiTender = Math.max(0, num(params.nilaiTender));
  const hppBarang = Math.max(0, num(params.hppBarang));
  const targetMargin = Math.max(0, num(params.targetMargin));
  const active = (params.komponenBiaya || []).filter((c) => c.isActive !== false);

  // 1) "Biaya Langsung base": jumlah komponen direct-cost yang TIDAK berbasis
  //    biaya_langsung (menghindari dependensi melingkar). Dievaluasi lebih dulu
  //    supaya komponen %-of-biaya-langsung punya basis yang stabil.
  let biayaLangsungBase = 0;
  for (const c of active) {
    if (c.isDirectCost && c.basis !== 'biaya_langsung') {
      biayaLangsungBase += computeComponentAmount(c, nilaiTender, hppBarang, 0);
    }
  }

  // 2) Hitung nominal setiap komponen secara penuh.
  const components: CostingComponentResult[] = active.map((c) => ({
    ...c,
    computedAmount: computeComponentAmount(c, nilaiTender, hppBarang, biayaLangsungBase),
  }));

  const totalKomponen = components.reduce((s, c) => s + c.computedAmount, 0);
  const biayaLangsung = roundRupiah(
    components.filter((c) => c.isDirectCost).reduce((s, c) => s + c.computedAmount, 0)
  );
  const totalBiaya = roundRupiah(hppBarang + totalKomponen);
  const estimasiLaba = roundRupiah(nilaiTender - totalBiaya);

  const marginPersen = nilaiTender > 0 ? roundPercent((estimasiLaba / nilaiTender) * 100) : 0;
  const markupPersen = hppBarang > 0 ? roundPercent(((nilaiTender - hppBarang) / hppBarang) * 100) : null;

  // 3) Pisahkan biaya VARIABEL (persentase dari Nilai Tender) vs FIXED.
  const totalRateVariabel = components
    .filter((c) => c.inputType === 'percent' && (c.basis ?? 'nilai_tender') === 'nilai_tender')
    .reduce((s, c) => s + Math.max(0, num(c.value)) / 100, 0);
  const variabelCostAtCurrent = components
    .filter((c) => c.inputType === 'percent' && (c.basis ?? 'nilai_tender') === 'nilai_tender')
    .reduce((s, c) => s + c.computedAmount, 0);
  const biayaTetap = Math.max(0, totalBiaya - variabelCostAtCurrent);

  // Harga BEP: harga jual di mana laba = 0.
  const denomBep = 1 - totalRateVariabel;
  const hargaBep = denomBep > 0 ? roundRupiah(biayaTetap / denomBep) : 0;

  // Harga Target: harga jual agar margin bersih = targetMargin.
  const denomTarget = 1 - totalRateVariabel - targetMargin / 100;
  const hargaTarget = denomTarget > 0 ? roundRupiah(biayaTetap / denomTarget) : null;

  // HPP Maksimal: HPP tertinggi agar pada Nilai Tender saat ini margin >= target.
  const percentOfHppRate = components
    .filter((c) => c.inputType === 'percent' && c.basis === 'hpp')
    .reduce((s, c) => s + Math.max(0, num(c.value)) / 100, 0);
  const costsProportionalToHpp = hppBarang * (1 + percentOfHppRate);
  const nonHppCosts = Math.max(0, totalBiaya - costsProportionalToHpp);
  const hppBudget = nilaiTender * (1 - targetMargin / 100) - nonHppCosts;
  const hppMaksimalRaw = hppBudget / (1 + percentOfHppRate);
  const hppMaksimal = Number.isFinite(hppMaksimalRaw) ? roundRupiah(Math.max(0, hppMaksimalRaw)) : null;

  // 4) Status kesehatan tender.
  let status: CostingStatus;
  if (marginPersen < 0) {
    status = 'BAHAYA';
  } else if (marginPersen < targetMargin) {
    status = 'WASPADA';
  } else {
    status = 'AMAN';
  }

  return {
    nilaiTender,
    hppBarang,
    biayaLangsung,
    totalBiaya,
    estimasiLaba,
    marginPersen,
    markupPersen,
    hargaBep,
    hargaTarget,
    hppMaksimal,
    targetMargin,
    status,
    components,
  };
}

/** Komponen biaya default untuk costing baru (belum pernah disimpan). */
export function defaultCostingComponents(): CostingComponentInput[] {
  return [
    { name: 'Ongkir', inputType: 'rp', value: 0, isDirectCost: true, isActive: true, sortOrder: 1 },
    { name: 'Tenaga Kerja', inputType: 'rp', value: 0, isDirectCost: true, isActive: true, sortOrder: 2 },
    { name: 'Komisi', inputType: 'percent', value: 3, basis: 'nilai_tender', isDirectCost: false, isActive: true, sortOrder: 3 },
    { name: 'Iklan', inputType: 'percent', value: 2, basis: 'nilai_tender', isDirectCost: false, isActive: true, sortOrder: 4 },
    { name: 'Pajak', inputType: 'percent', value: 11, basis: 'nilai_tender', isDirectCost: false, isActive: true, sortOrder: 5 },
    { name: 'Overhead', inputType: 'percent', value: 3, basis: 'nilai_tender', isDirectCost: false, isActive: true, sortOrder: 6 },
    { name: 'Cadangan Risiko', inputType: 'percent', value: 2, basis: 'nilai_tender', isDirectCost: false, isActive: true, sortOrder: 7 },
  ];
}

export function statusLabel(status: CostingStatus): string {
  switch (status) {
    case 'AMAN':
      return 'AMAN — Target Margin Tercapai';
    case 'WASPADA':
      return 'PERLU DIWASPADAI — Di Bawah Target';
    case 'BAHAYA':
      return 'BAHAYA — TENDER RUGI';
  }
}
