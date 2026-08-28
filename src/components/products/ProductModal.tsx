import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { StorageService } from '../../lib/storage';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Package, CheckCircle2 } from 'lucide-react';

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Jasa Profesional',
    description: '',
    unit: 'Paket',
    price: 0,
    taxRate: 11,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        code: productToEdit.code,
        name: productToEdit.name,
        category: productToEdit.category,
        description: productToEdit.description,
        unit: productToEdit.unit,
        price: productToEdit.price,
        taxRate: productToEdit.taxRate,
        isActive: productToEdit.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'Jasa Profesional',
        description: '',
        unit: 'Paket',
        price: 0,
        taxRate: 11,
        isActive: true,
      });
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nama item produk/jasa wajib diisi';
    if (formData.price < 0) errs.price = 'Harga satuan tidak boleh negatif';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const saved = await StorageService.saveProduct({
        ...(productToEdit ? { id: productToEdit.id } : {}),
        ...formData,
      });
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <span>{productToEdit ? 'Edit Master Produk / Jasa' : 'Tambah Master Produk / Jasa Baru'}</span>
        </div>
      }
      subtitle="Katalog item standar untuk kemudahan pengisian invoice"
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {productToEdit ? 'Perbarui Item' : 'Simpan Item'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nama Produk / Layanan Jasa"
              placeholder="e.g. Implementasi Software ERP"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />
          </div>
          <div>
            <Input
              label="Kode / SKU"
              placeholder="e.g. SRV-01"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label="Kategori"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Jasa Profesional">Jasa Profesional</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Lisensi Software">Lisensi Software</option>
              <option value="Training">Training</option>
              <option value="Konsultasi">Konsultasi</option>
              <option value="Hardware / Fisik">Hardware / Fisik</option>
              <option value="Lainnya">Lainnya</option>
            </Select>
          </div>
          <div>
            <Input
              label="Satuan"
              placeholder="Paket, Bulan, Jam, Pcs..."
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Tarif Pajak (PPN %)"
              type="number"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Input
            label="Harga Satuan (Rp)"
            type="number"
            placeholder="50000000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            error={errors.price}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Deskripsi Pekerjaan / Layanan
          </label>
          <textarea
            rows={3}
            placeholder="Rincian lingkup kerja default yang akan otomatis terisi saat item ini dipilih pada invoice..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <Select
            label="Status Item"
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
          >
            <option value="true">Aktif (Tersedia untuk Invoice)</option>
            <option value="false">Non-Aktif</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
};
