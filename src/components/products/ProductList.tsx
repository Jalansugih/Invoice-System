import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProductModal } from './ProductModal';
import { ProductImportModal } from './ProductImportModal';
import { Package, Search, Plus, Download, Upload, Edit2, Trash2, Tag, Boxes, ArrowDownUp, ArrowDownToLine } from 'lucide-react';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState(StorageService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState(0);
  const [stockNote, setStockNote] = useState('');
  const [stockBusy, setStockBusy] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<Product | null>(null);
  const [receiptQty, setReceiptQty] = useState(0);
  const [receiptCost, setReceiptCost] = useState(0);
  const [receiptType, setReceiptType] = useState<'OPENING'|'PURCHASE'|'RETURN_IN'|'ADJUSTMENT_IN'>('PURCHASE');
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptBusy, setReceiptBusy] = useState(false);

  const refreshData = () => {
    setProducts(StorageService.getProducts());
  };

  const saveStockAdjustment = async () => {
    if (!stockTarget || !stockDelta) return;
    setStockBusy(true);
    try {
      await StorageService.adjustProductStock(stockTarget.id, stockDelta, stockNote || (stockDelta > 0 ? 'Penerimaan stok' : 'Pengeluaran stok'));
      setStockTarget(null); setStockDelta(0); setStockNote(''); refreshData();
    } catch (e: any) { alert(e?.message || 'Gagal memperbarui stok'); } finally { setStockBusy(false); }
  };

  const saveInventoryReceipt = async () => {
    if (!receiptTarget || receiptQty <= 0) return;
    setReceiptBusy(true);
    try {
      await StorageService.recordInventoryReceipt({ productId: receiptTarget.id, quantity: receiptQty, unitCost: receiptCost, movementType: receiptType, notes: receiptNote });
      setReceiptTarget(null); setReceiptQty(0); setReceiptCost(0); setReceiptNote(''); setReceiptType('PURCHASE'); refreshData();
    } catch (e: any) { alert(e?.message || 'Gagal mencatat stok masuk'); } finally { setReceiptBusy(false); }
  };

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleExportCSV = () => {
    const data = filteredProducts.map((p) => ({
      'Kode Item': p.code,
      'Nama Item': p.name,
      'Kategori': p.category,
      'Satuan': p.unit,
      'Harga Satuan': p.price,
      'PPN (%)': p.taxRate,
      'Deskripsi': p.description,
      'Status': p.isActive ? 'Aktif' : 'Non-Aktif',
    }));
    exportToCSV(`Katalog_Produk_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;
    try {
      StorageService.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Master Produk & Jasa Penagihan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Katalog barang, jasa profesional, tarif maintenance, dan lisensi untuk invoice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import Massal
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Produk / Jasa
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Cari nama produk, kode SKU, atau kata kunci deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Kode & Nama Item</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Satuan</th>
                <th className="py-3 px-4 text-right">Harga Satuan (IDR)</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-center">Pajak (PPN)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada item produk/jasa yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prd) => (
                  <tr key={prd.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{prd.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prd.code}</p>
                      {prd.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-sm">
                          {prd.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {prd.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">{prd.unit}</td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(prd.price)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {prd.trackInventory ? (
                        <button onClick={() => { setStockTarget(prd); setStockDelta(0); setStockNote(''); }} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold ${(prd.stockQty ?? 0) <= (prd.minStock ?? 0) ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          <Boxes className="w-3 h-3" /> {prd.stockQty ?? 0} {prd.unit}
                        </button>
                      ) : <span className="text-[10px] text-slate-400">Non-stok</span>}
                    </td>

                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {prd.taxRate}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant={prd.isActive ? 'success' : 'default'} size="sm">
                        {prd.isActive ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {prd.trackInventory && (
                          <button onClick={() => { setReceiptTarget(prd); setReceiptQty(0); setReceiptCost(prd.costPrice ?? 0); setReceiptType('PURCHASE'); setReceiptNote(''); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Stok Masuk">
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setProductToEdit(prd);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(prd)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSuccess={() => refreshData()}
      />

      {/* Mass Import Modal */}
      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => refreshData()}
      />

      {receiptTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><ArrowDownToLine className="w-4 h-4" /> Stok Masuk & HPP</h3>
            <p className="text-xs text-slate-500 mt-1">{receiptTarget.name} • stok {receiptTarget.stockQty ?? 0} {receiptTarget.unit} • HPP saat ini {formatRupiah(receiptTarget.costPrice ?? 0)}</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Input label="Jumlah Masuk" type="number" min={0} value={receiptQty} onChange={e => setReceiptQty(Number(e.target.value))} />
              <Input label="Harga Pokok / Unit" type="number" min={0} value={receiptCost} onChange={e => setReceiptCost(Number(e.target.value))} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Stok Masuk</label>
              <select value={receiptType} onChange={e => setReceiptType(e.target.value as any)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs">
                <option value="PURCHASE">Pembelian</option><option value="OPENING">Saldo Awal</option><option value="RETURN_IN">Retur Penjualan</option><option value="ADJUSTMENT_IN">Penyesuaian Masuk</option>
              </select>
            </div>
            <div className="mt-3"><Input label="Catatan" placeholder="Contoh: pembelian vendor / saldo awal" value={receiptNote} onChange={e => setReceiptNote(e.target.value)} /></div>
            <div className="flex justify-end gap-2 mt-5"><Button variant="outline" size="sm" onClick={() => setReceiptTarget(null)}>Batal</Button><Button size="sm" disabled={!receiptQty || receiptBusy} isLoading={receiptBusy} onClick={saveInventoryReceipt}>Simpan Stok Masuk</Button></div>
          </div>
        </div>
      )}

      {stockTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="font-bold text-slate-900 flex items-center gap-2"><ArrowDownUp className="w-4 h-4" /> Penyesuaian Stok</h3><p className="text-xs text-slate-500 mt-1">{stockTarget.name} • stok saat ini {stockTarget.stockQty ?? 0} {stockTarget.unit}</p></div>
              <button onClick={() => setStockTarget(null)} className="text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Input label="Perubahan (+ / -)" type="number" value={stockDelta} onChange={e => setStockDelta(Number(e.target.value))} />
              <Input label="Stok setelah" type="number" value={Math.max(0, (stockTarget.stockQty ?? 0) + (stockDelta || 0))} readOnly />
            </div>
            <Input label="Catatan" placeholder="Contoh: pembelian dari vendor / stok rusak" value={stockNote} onChange={e => setStockNote(e.target.value)} />
            <div className="flex justify-end gap-2 mt-5"><Button variant="outline" size="sm" onClick={() => setStockTarget(null)}>Batal</Button><Button size="sm" disabled={!stockDelta || stockBusy} isLoading={stockBusy} onClick={saveStockAdjustment}>Simpan Penyesuaian</Button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Master Produk"
        message={`Apakah Anda yakin ingin menghapus "${productToDelete?.name}"?`}
        confirmText="Hapus"
      />
    </div>
  );
};
