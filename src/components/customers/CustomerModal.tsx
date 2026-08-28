import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { StorageService } from '../../lib/storage';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Building2, User, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSuccess: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    companyName: '',
    npwp: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: 'DKI Jakarta',
    postalCode: '',
    pic: '',
    picPhone: '',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        code: customerToEdit.code,
        name: customerToEdit.name,
        companyName: customerToEdit.companyName,
        npwp: customerToEdit.npwp || '',
        email: customerToEdit.email,
        phone: customerToEdit.phone,
        address: customerToEdit.address,
        city: customerToEdit.city,
        province: customerToEdit.province,
        postalCode: customerToEdit.postalCode,
        pic: customerToEdit.pic,
        picPhone: customerToEdit.picPhone || '',
        notes: customerToEdit.notes || '',
        isActive: customerToEdit.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        companyName: '',
        npwp: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: 'DKI Jakarta',
        postalCode: '',
        pic: '',
        picPhone: '',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [customerToEdit, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nama pelanggan/entitas wajib diisi';
    if (!formData.companyName.trim()) errs.companyName = 'Nama perusahaan wajib diisi';
    if (!formData.email.trim()) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!formData.phone.trim()) errs.phone = 'Nomor telepon wajib diisi';
    if (!formData.address.trim()) errs.address = 'Alamat penagihan wajib diisi';
    if (!formData.pic.trim()) errs.pic = 'Nama PIC / Kontak Person wajib diisi';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const saved = await StorageService.saveCustomer({
        ...(customerToEdit ? { id: customerToEdit.id } : {}),
        ...formData,
      });
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data pelanggan');
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
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>{customerToEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</span>
        </div>
      }
      subtitle="Data profil penagihan resmi untuk faktur dan surat tagihan"
      maxWidth="3xl"
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
            {customerToEdit ? 'Perbarui Pelanggan' : 'Simpan Pelanggan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Entity info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Pelanggan (Display)"
            placeholder="e.g. PT Telkom Prima Nusantara"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Nama Perusahaan Resmi (Legal)"
            placeholder="e.g. PT Telkom Prima Nusantara"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            error={errors.companyName}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="NPWP Perusahaan (Faktur Pajak)"
            placeholder="00.000.000.0-000.000"
            value={formData.npwp}
            onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
            helperText="Opsional untuk kebutuhan Faktur Pajak"
          />
          <Input
            label="Kode Pelanggan (Opsional)"
            placeholder="Auto-generate jika kosong (e.g. CUST-006)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        </div>

        {/* Section 2: Contact & PIC */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Finance / Penagihan"
            type="email"
            placeholder="finance@perusahaan.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            label="No. Telepon Kantor"
            placeholder="+62 21 xxxx xxxx"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama PIC / Kontak Person"
            placeholder="e.g. Ir. Hendra Gunawan"
            value={formData.pic}
            onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
            error={errors.pic}
            required
          />
          <Input
            label="No. HP / WhatsApp PIC"
            placeholder="+62 812 xxxx xxxx"
            value={formData.picPhone}
            onChange={(e) => setFormData({ ...formData, picPhone: e.target.value })}
          />
        </div>

        {/* Section 3: Address */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <Input
            label="Alamat Penagihan Lengkap"
            placeholder="Gedung, Jalan, No, RT/RW, Kelurahan, Kecamatan"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Kota / Kabupaten"
              placeholder="Jakarta Selatan"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Provinsi"
              placeholder="DKI Jakarta"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            />
            <Input
              label="Kode Pos"
              placeholder="12950"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </div>
        </div>

        {/* Section 4: Notes & Status */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <Input
              label="Catatan Khusus (Internal)"
              placeholder="Termin pembayaran khusus, kontak procurement tambahan..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Status Pelanggan"
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            >
              <option value="true">Aktif</option>
              <option value="false">Non-Aktif</option>
            </Select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
