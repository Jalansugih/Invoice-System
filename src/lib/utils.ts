import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatIndoDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Converts numbers into Indonesian formal spelled-out words (Terbilang).
 * e.g. 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (n === 0) return 'Nol Rupiah';
  if (n < 0) return 'Minus ' + terbilang(Math.abs(n));

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function convert(num: number): string {
    let temp = '';
    if (num < 12) {
      temp = ' ' + satuan[num];
    } else if (num < 20) {
      temp = convert(num - 10) + ' Belas';
    } else if (num < 100) {
      temp = convert(Math.floor(num / 10)) + ' Puluh' + convert(num % 10);
    } else if (num < 200) {
      temp = ' Seratus' + convert(num - 100);
    } else if (num < 1000) {
      temp = convert(Math.floor(num / 100)) + ' Ratus' + convert(num % 100);
    } else if (num < 2000) {
      temp = ' Seribu' + convert(num - 1000);
    } else if (num < 1000000) {
      temp = convert(Math.floor(num / 1000)) + ' Ribu' + convert(num % 1000);
    } else if (num < 1000000000) {
      temp = convert(Math.floor(num / 1000000)) + ' Juta' + convert(num % 1000000);
    } else if (num < 1000000000000) {
      temp = convert(Math.floor(num / 1000000000)) + ' Miliar' + convert(num % 1000000000);
    } else if (num < 1000000000000000) {
      temp = convert(Math.floor(num / 1000000000000)) + ' Triliun' + convert(num % 1000000000000);
    }
    return temp;
  }

  const result = convert(Math.floor(n)).trim();
  return (result.charAt(0).toUpperCase() + result.slice(1)) + ' Rupiah';
}

export function formatDocNumber(
  template: string,
  sequenceNum: number,
  date: Date = new Date()
): string {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const numStr = String(sequenceNum).padStart(5, '0');

  let result = template || 'INV/{YEAR}/{MONTH}/{NUMBER}';
  result = result.replace('{YEAR}', year);
  result = result.replace('{MONTH}', month);
  result = result.replace('{NUMBER}', numStr);
  return result;
}

export function calculateDueDate(issueDateStr: string, termDays: number): string {
  const issueDate = new Date(issueDateStr);
  if (isNaN(issueDate.getTime())) return new Date().toISOString().split('T')[0];
  issueDate.setDate(issueDate.getDate() + termDays);
  return issueDate.toISOString().split('T')[0];
}

export function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'partially_paid':
      return { label: 'Dibayar Sebagian', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'unpaid':
      return { label: 'Belum Dibayar', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'overdue':
      return { label: 'Jatuh Tempo', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'sent':
      return { label: 'Terkirim', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'viewed':
      return { label: 'Dilihat', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'draft':
      return { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'cancelled':
      return { label: 'Dibatalkan', bg: 'bg-gray-100 text-gray-500 border-gray-200' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parser CSV minimal (tanpa dependency eksternal) yang tetap sadar tanda kutip
 * RFC4180: mendukung koma & baris baru di dalam field yang diapit '"', serta
 * escape tanda kutip ganda (""). Baris pertama dianggap header.
 * Mengembalikan array of objects {header: value}. Baris kosong diabaikan.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  // Normalisasi line ending & buang BOM di awal file (umum dari Excel)
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  // Field/baris terakhir (file tanpa newline penutup)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmptyRows.length === 0) return [];

  const headers = nonEmptyRows[0].map((h) => h.trim());
  return nonEmptyRows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}
