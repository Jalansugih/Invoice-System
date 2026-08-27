import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProductModal } from './ProductModal';
import { Package, Search, Plus, Download, Edit2, Trash2, Tag, CloudOff, RefreshCw } from 'lucide-react';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState(StorageService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [syncFailureCount, setSyncFailureCount] = useState(
    () => StorageService.getSyncFailures().filter((f) => f.table === 'products').length
  );
  const [isRetrying, setIsRetrying] = useState(false);

  React.useEffect(() => {
    return StorageService.subscribeSyncStatus(() => {
      setSyncFailureCount(StorageService.getSyncFailures().filter((f) => f.table === 'products').length);
    });
  }, []);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await StorageService.retryFailedSyncs();
    } finally {
      setIsRetrying(false);
    }
  };

  const refreshData = () => {
    setProducts(StorageService.getProducts());
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
          {syncFailureCount > 0 && (
            <button
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 hover:bg-amber-100 transition-colors disabled:opacity-60"
              title="Beberapa produk belum berhasil tersimpan ke cloud (Supabase). Klik untuk coba lagi."
            >
              {isRetrying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              {syncFailureCount} produk belum tersinkron ke cloud — coba lagi
            </button>
          )}
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
                <th className="py-3 px-4 text-center">Pajak (PPN)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
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
