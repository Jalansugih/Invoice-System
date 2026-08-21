import React, { useState } from 'react';
import { TaxPeriodSummary, TaxUserRole } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck2,
  CreditCard,
  Send,
  AlertTriangle,
  Clock,
  UserCheck,
} from 'lucide-react';

interface TaxPeriodWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodSummary: TaxPeriodSummary;
  onSuccess: () => void;
}

export const TaxPeriodWorkflowModal: React.FC<TaxPeriodWorkflowModalProps> = ({
  isOpen,
  onClose,
  periodSummary,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<TaxUserRole>('manager');
  const [targetStatus, setTargetStatus] = useState<TaxPeriodSummary['status']>(
    periodSummary.status === 'draft'
      ? 'review'
      : periodSummary.status === 'review'
      ? 'ready_to_file'
      : 'filed'
  );

  const [paymentDate, setPaymentDate] = useState(
    periodSummary.paymentDate || new Date().toISOString().slice(0, 10)
  );
  const [ntpn, setNtpn] = useState(periodSummary.ntpn || '');
  const [billingCode, setBillingCode] = useState(periodSummary.billingCode || '');
  const [filingDate, setFilingDate] = useState(
    periodSummary.filingDate || new Date().toISOString().slice(0, 10)
  );
  const [bpeNumber, setBpeNumber] = useState(
    periodSummary.bpeNumber || `BPE-DJP-${periodSummary.year}${String(periodSummary.month).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleProgress = (e: React.FormEvent) => {
    e.preventDefault();

    TaxService.updatePeriodWorkflow(periodSummary.year, periodSummary.month, {
      status: targetStatus,
      paymentDate: targetStatus === 'filed' || ntpn ? paymentDate : undefined,
      ntpn: ntpn ? ntpn.trim() : undefined,
      billingCode: billingCode ? billingCode.trim() : undefined,
      filingDate: targetStatus === 'filed' ? filingDate : undefined,
      bpeNumber: targetStatus === 'filed' ? bpeNumber.trim() : undefined,
      userRole: selectedRole,
      reason: reason.trim() || `Pembaruan status alur kerja periode pajak ke ${targetStatus}`,
    });

    onSuccess();
    onClose();
  };

  const steps = [
    { key: 'draft', label: '1. Pengumpulan & Draft Data Pajak', desc: 'Transaksi invoice, bill, dan bupot dicatat' },
    { key: 'review', label: '2. Review & Rekonsiliasi Fiskal', desc: 'Tax officer mencocokkan GL & aturan pajak' },
    { key: 'ready_to_file', label: '3. Approval & Siap Lapor', desc: 'Manager menyetujui draft SPT & kode billing' },
    { key: 'filed', label: '4. Pembayaran & Pelaporan DJP', desc: 'Input NTPN, BPE resmi DJP, & Kunci Periode' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alur Persetujuan & Pelaporan Masa Pajak: {periodSummary.periodLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Kontrol tahapan penyusunan SPT, otorisasi manajemen, penyetoran NTPN, hingga pelaporan DJP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleProgress} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Timeline View */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Status Alur Kerja Saat Ini
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {steps.map((s, idx) => {
                const isCurrent = periodSummary.status === s.key;
                const isPast =
                  (periodSummary.status === 'review' && s.key === 'draft') ||
                  (periodSummary.status === 'ready_to_file' && ['draft', 'review'].includes(s.key)) ||
                  (periodSummary.status === 'filed');

                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                        : isPast
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                      )}
                      {s.label}
                    </div>
                    <p className="text-[10px] mt-0.5 opacity-80 pl-5">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Peran Pengguna (Role Permission)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TaxUserRole)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 font-medium"
              >
                <option value="manager">Manager / CFO (Otorisasi & Approval)</option>
                <option value="tax_officer">Tax Officer (Pemeriksa & Rekonsiliasi)</option>
                <option value="accounting">Accounting (Penyusun Data Pajak)</option>
                <option value="finance">Finance (Pembayaran & Billing)</option>
                <option value="admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ubah Status Menjadi
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-blue-500 bg-blue-50/30 px-3 text-xs text-blue-900 font-bold"
              >
                <option value="draft">Draft (Pengumpulan Data)</option>
                <option value="review">Review (Pemeriksaan Rekonsiliasi)</option>
                <option value="ready_to_file">Siap Dilaporkan (Approved)</option>
                <option value="filed">Sudah Dilaporkan DJP & Kunci Periode</option>
              </select>
            </div>
          </div>

          {/* Details for Ready to File / Filed */}
          {(targetStatus === 'ready_to_file' || targetStatus === 'filed') && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Data Penyetoran & Bukti Pelaporan Elektronik (BPE)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Billing e-Billing (15 digit)
                  </label>
                  <Input
                    value={billingCode}
                    onChange={(e) => setBillingCode(e.target.value)}
                    placeholder="Contoh: 019283746554123"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor NTPN (Nomor Transaksi Penerimaan Negara)
                  </label>
                  <Input
                    value={ntpn}
                    onChange={(e) => setNtpn(e.target.value)}
                    placeholder="Contoh: 88A1B2C3D4E5F678"
                  />
                </div>
              </div>

              {targetStatus === 'filed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Tanda Terima BPE DJP Online
                    </label>
                    <Input
                      value={bpeNumber}
                      onChange={(e) => setBpeNumber(e.target.value)}
                      placeholder="Contoh: BPE-DJP-202608-009182"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Pelaporan Resmi
                    </label>
                    <Input
                      type="date"
                      value={filingDate}
                      onChange={(e) => setFilingDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan / Alasan Perubahan Status (Dicatat di Audit Trail)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Semua rekonsiliasi telah cocok dan NTPN tervalidasi di bank persepsi"
            />
          </div>

          {targetStatus === 'filed' && (
            <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-300">Penguncian Data Masa Pajak (Lock Period)</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Setelah status diubah menjadi <strong>Sudah Dilaporkan</strong>, seluruh transaksi dan faktur pada masa {periodSummary.periodLabel} akan dikunci agar tidak dapat diubah tanpa persetujuan Admin/Auditor.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Simpan & Lanjutkan Alur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
