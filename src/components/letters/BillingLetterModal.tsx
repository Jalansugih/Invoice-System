import React, { useState, useEffect } from 'react';
import { BillingLetter, Invoice } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, calculateDueDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Mail, Calendar, Building2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export interface BillingLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: Invoice | null;
  letterToEdit?: BillingLetter | null;
  onSuccess: (letter: BillingLetter) => void;
}

export const BillingLetterModal: React.FC<BillingLetterModalProps> = ({
  isOpen,
  onClose,
  initialInvoice,
  letterToEdit,
  onSuccess,
}) => {
  const org = StorageService.getOrganization();
  const invoices = StorageService.getInvoices().filter((i) => i.outstandingAmount > 0 && i.status !== 'cancelled');

  const [invoiceId, setInvoiceId] = useState(initialInvoice?.id || invoices[0]?.id || '');
  const [letterType, setLetterType] = useState<BillingLetter['letterType']>('sp1');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDeadline, setPaymentDeadline] = useState(calculateDueDate(new Date().toISOString().split('T')[0], 7));
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [penaltiesAmount, setPenaltiesAmount] = useState(0);
  const [status, setStatus] = useState<BillingLetter['status']>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInvoice = invoices.find((i) => i.id === invoiceId) || initialInvoice;

  // Auto generate standard Indonesian legal dunning letter template
  const generateTemplate = (type: BillingLetter['letterType'], inv?: Invoice | null, deadlineStr?: string) => {
    if (!inv) return { subject: '', body: '' };

    const invDateStr = formatIndoDate(inv.issueDate);
    const dueDateStr = formatIndoDate(inv.dueDate);
    const deadlineFormatted = formatIndoDate(deadlineStr || paymentDeadline);
    const totalDue = formatRupiah(inv.outstandingAmount);

    switch (type) {
      case 'sp1':
        return {
          subject: `Surat Pengingat Pembayaran Faktur No. ${inv.invoiceNumber} (Peringatan I)`,
          body: `Dengan hormat,

Sehubungan dengan catatan administrasi keuangan kami, bersama surat ini kami bermaksud mengingatkan bahwa Faktur/Invoice No. ${inv.invoiceNumber} tertanggal ${invDateStr} dengan nilai kewajiban sebesar ${totalDue} telah melewati batas waktu jatuh tempo pembayaran pada tanggal ${dueDateStr}.

Mengingat kerjasama baik yang telah terjalin selama ini, kami memohon bantuan Bapak/Ibu untuk dapat segera memproses pelunasan tagihan tersebut paling lambat pada tanggal ${deadlineFormatted}.

Apabila pembayaran telah dilakukan sebelum diterimanya surat ini, mohon agar surat ini dapat diabaikan atau mengkonfirmasikan bukti transfer kepada tim Finance kami. Atas perhatian dan kerjasamanya, kami sampaikan terima kasih.`,
        };

      case 'sp2':
        return {
          subject: `Surat Peringatan Pembayaran II (SP-2) - Faktur No. ${inv.invoiceNumber}`,
          body: `Dengan hormat,

Menindaklanjuti Surat Pengingat Pertama (SP-1) yang telah kami kirimkan sebelumnya terkait kewajiban Faktur No. ${inv.invoiceNumber} sebesar ${totalDue}, dengan ini kami sampaikan bahwa hingga saat ini kami belum menerima konfirmasi pelunasan dari pihak Bapak/Ibu.

Kami mengharapkan itikad baik untuk menyelesaikan pembayaran tagihan yang telah tertunggak ini selambat-lambatnya pada tanggal ${deadlineFormatted}.

Kelancaran pemenuhan kewajiban ini sangat penting guna kelangsungan kerjasama bisnis dan penyediaan layanan selanjutnya. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.`,
        };

      case 'sp3':
      case 'somasi':
        return {
          subject: `SURAT PERINGATAN TERAKHIR (SP-3) / SOMASI - Faktur No. ${inv.invoiceNumber}`,
          body: `Dengan hormat,

Berdasarkan catatan pembukuan kami, kewajiban penagihan Faktur No. ${inv.invoiceNumber} tertanggal ${invDateStr} sebesar ${totalDue} telah jatuh tempo sejak ${dueDateStr} dan belum diselesaikan meskipun telah diberikan surat peringatan bertahap sebelumnya.

Bersama surat ini, kami memberikan TEGURAN TERAKHIR kepada pihak Bapak/Ibu untuk segera melunasi seluruh total tunggakan sebesar ${totalDue} secara penuh paling lambat pada tanggal ${deadlineFormatted}.

Apabila sampai dengan batas waktu yang ditentukan di atas kewajiban tersebut belum diselesaikan, maka dengan sangat menyesal kami akan menempuh jalur hukum sesuai perundang-undangan yang berlaku serta menangguhkan seluruh fasilitas layanan. Demikian surat peringatan ini kami sampaikan untuk menjadi perhatian serius.`,
        };

      default:
        return {
          subject: `Pemberitahuan Tagihan Pembayaran - Faktur No. ${inv.invoiceNumber}`,
          body: `Dengan hormat,\n\nBersama ini kami sampaikan rincian tagihan Faktur No. ${inv.invoiceNumber} sebesar ${totalDue} yang akan jatuh tempo pada ${dueDateStr}.\n\nTerima kasih.`,
        };
    }
  };

  useEffect(() => {
    if (letterToEdit) {
      setInvoiceId(letterToEdit.invoiceId);
      setLetterType(letterToEdit.letterType);
      setLetterDate(letterToEdit.letterDate);
      setPaymentDeadline(letterToEdit.paymentDeadline);
      setSubject(letterToEdit.subject);
      setBodyText(letterToEdit.bodyText);
      setPenaltiesAmount(letterToEdit.penaltiesAmount);
      setStatus(letterToEdit.status);
    } else if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      const deadlineStr = calculateDueDate(todayStr, 7);
      setLetterDate(todayStr);
      setPaymentDeadline(deadlineStr);
      setPenaltiesAmount(0);
      setStatus('draft');

      const inv = initialInvoice || invoices[0];
      if (inv) {
        setInvoiceId(inv.id);
        const { subject: genSub, body: genBody } = generateTemplate('sp1', inv, deadlineStr);
        setSubject(genSub);
        setBodyText(genBody);
      }
    }
  }, [letterToEdit, initialInvoice, isOpen]);

  const handleTypeChange = (newType: BillingLetter['letterType']) => {
    setLetterType(newType);
    const { subject: s, body: b } = generateTemplate(newType, selectedInvoice, paymentDeadline);
    setSubject(s);
    setBodyText(b);
  };

  const handleInvoiceSelect = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      const { subject: s, body: b } = generateTemplate(letterType, inv, paymentDeadline);
      setSubject(s);
      setBodyText(b);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) {
      alert('Pilih invoice target penagihan');
      return;
    }
    if (!subject.trim() || !bodyText.trim()) {
      alert('Perihal dan isi surat tagihan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = StorageService.saveBillingLetter({
        ...(letterToEdit ? { id: letterToEdit.id } : {}),
        invoiceId,
        letterType,
        letterDate,
        paymentDeadline,
        subject,
        bodyText,
        penaltiesAmount,
        status,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan surat tagihan');
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
          <Mail className="w-5 h-5 text-amber-600" />
          <span>{letterToEdit ? 'Edit Surat Tagihan / Somasi' : 'Terbitkan Surat Tagihan (Dunning Letter)'}</span>
        </div>
      }
      subtitle="Dokumen resmi penagihan bertahap (SP 1, SP 2, SP 3 / Somasi Hukum)"
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
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {letterToEdit ? 'Simpan Perubahan' : 'Terbitkan Surat Tagihan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <Select
              label="Pilih Faktur / Invoice Tertunggak"
              value={invoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              required
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customerName} ({formatRupiah(inv.outstandingAmount)})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Tingkat Dokumen Penagihan"
              value={letterType}
              onChange={(e) => handleTypeChange(e.target.value as any)}
            >
              <option value="sp1">Surat Peringatan 1 (SP-1 / Reminder Ramah)</option>
              <option value="sp2">Surat Peringatan 2 (SP-2 / Teguran Formal)</option>
              <option value="sp3">Surat Peringatan 3 (SP-3 / Peringatan Terakhir)</option>
              <option value="somasi">Somasi / Teguran Hukum</option>
              <option value="pemberitahuan">Pemberitahuan Biasa</option>
            </Select>
          </div>
        </div>

        {selectedInvoice && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div>
              <p className="font-bold">Klien: {selectedInvoice.customerName} ({selectedInvoice.customerCompanyName})</p>
              <p className="text-[11px] text-amber-700">Jatuh Tempo Faktur: {formatIndoDate(selectedInvoice.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-amber-900">{formatRupiah(selectedInvoice.outstandingAmount)}</p>
              <p className="text-[10px] text-amber-700">Sisa Tunggakan</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Tanggal Surat"
              type="date"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Batas Akhir Pelunasan"
              type="date"
              value={paymentDeadline}
              onChange={(e) => setPaymentDeadline(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Denda / Biaya Keterlambatan (Rp)"
              type="number"
              value={penaltiesAmount}
              onChange={(e) => setPenaltiesAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Input
            label="Perihal Surat (Subject)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Isi Redaksi Surat Tagihan (Dapat Disesuaikan)
          </label>
          <textarea
            rows={10}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            required
          />
        </div>
      </form>
    </Modal>
  );
};
