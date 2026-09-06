/**
 * Satu-satunya sumber kebenaran untuk rumus perhitungan invoice
 * (qty x harga - diskon, lalu pajak per-item dengan diskon invoice
 * yang diprorata sesuai porsi subtotal masing-masing item).
 *
 * Sebelumnya rumus ini diketik ulang secara manual di beberapa
 * tempat (InvoiceFormModal.tsx, storage.ts, BusinessDocumentsView.tsx)
 * dengan pembulatan yang tidak konsisten (ada yang Math.round, ada
 * yang tidak). Import dari sini supaya kalau rumus berubah, cukup
 * diubah di satu tempat dan semua modul otomatis konsisten — ini
 * juga persis rumus yang ditegakkan ulang oleh trigger database di
 * migration_v22_invoice_integrity.sql, supaya angka yang tampil di
 * layar selalu sama dengan angka yang benar-benar tersimpan.
 */

export type DiscountType = 'percentage' | 'fixed';

export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceTotalsInput {
  discountType: DiscountType;
  discountValue: number;
  additionalCharges: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

/** Nilai satu baris item: max(0, qty * harga - diskon), dibulatkan ke rupiah penuh. */
export function calcLineAmount(quantity: number, unitPrice: number, discount: number): number {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  const rawTotal = qty * price;
  const disc = Math.min(rawTotal, Math.max(0, Number(discount) || 0));
  return Math.round(Math.max(0, rawTotal - disc));
}

/**
 * Total invoice dari daftar item + parameter diskon/pajak tingkat invoice.
 * item.amount di sini WAJIB sudah hasil calcLineAmount (lihat catatan di
 * pemanggil: jangan percaya amount yang datang dari luar tanpa dihitung ulang).
 */
export function calcInvoiceTotals(
  items: Array<{ amount: number; taxRate: number }>,
  opts: InvoiceTotalsInput
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const discountValue = Math.max(0, Number(opts.discountValue) || 0);
  const discountAmount =
    opts.discountType === 'percentage'
      ? Math.round((subtotal * Math.min(100, discountValue)) / 100)
      : Math.min(subtotal, discountValue);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Pajak dihitung PER ITEM memakai taxRate masing-masing baris (bukan satu
  // tarif global), supaya invoice yang mencampur item ber-PPN berbeda (mis.
  // 11% standar vs 0% ekspor/non-PKP) tetap akurat. Diskon invoice diprorata
  // ke tiap item sesuai porsi subtotalnya sebelum tarif pajak baris itu
  // diterapkan.
  let taxAmount = 0;
  if (subtotal > 0) {
    for (const item of items) {
      const amount = Number(item.amount) || 0;
      const itemDiscountShare = discountAmount * (amount / subtotal);
      const itemTaxable = Math.max(0, amount - itemDiscountShare);
      taxAmount += (itemTaxable * (Number(item.taxRate) || 0)) / 100;
    }
  }
  taxAmount = Math.round(taxAmount);

  const additionalCharges = Math.max(0, Number(opts.additionalCharges) || 0);
  const grandTotal = taxableAmount + taxAmount + additionalCharges;

  return { subtotal, discountAmount, taxableAmount, taxAmount, grandTotal };
}
