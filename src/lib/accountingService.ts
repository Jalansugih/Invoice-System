import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import { getCachedExpenses } from './expenseService';
import { Account, Expense, Invoice, Payment } from '../types';

export interface AccountingLine {
  code: string;
  name: string;
  accountType: string;
  amount: number;
}

export interface FinancialStatements {
  period: { startDate: string; endDate: string };
  profitLoss: {
    revenue: AccountingLine[];
    cogs: AccountingLine[];
    expenses: AccountingLine[];
    totalRevenue: number;
    totalCogs: number;
    totalExpenses: number;
    netProfit: number;
  };
  balanceSheet: {
    assets: AccountingLine[];
    liabilities: AccountingLine[];
    equity: AccountingLine[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    balanceCheck: number;
  };
  cashFlow: {
    openingCash: number;
    inflows: number;
    outflows: number;
    netCashFlow: number;
    closingCash: number;
  };
  receivables: { balance: number };
  payables: { balance: number };
  integrity: {
    postedJournals: number;
    unbalancedJournals: number;
    debitTotal: number;
    creditTotal: number;
    unjournalizedInvoices: number;
    unjournalizedPayments: number;
    unmappedBankPayments: number;
  };
}

const n = (v: unknown) => Number(v) || 0;
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
// Exported so CoaService can reuse the exact same baseline list as the
// offline/local fallback (single source of truth instead of a duplicate
// hardcoded copy). In Supabase mode this is NOT what powers the COA menu
// anymore — see src/lib/coaService.ts — it only seeds local/demo mode.
export const localAccounts: Account[] = [
  { id: '00000000-0000-4000-8100-000000000101', code: '1-1000', name: 'Kas', type: 'ASSET', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8100-000000000102', code: '1-1100', name: 'Bank BCA', type: 'ASSET', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8100-000000000103', code: '1-1200', name: 'Bank Mandiri', type: 'ASSET', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8100-000000000104', code: '1-2000', name: 'Piutang Usaha', type: 'ASSET', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8200-000000000101', code: '2-1000', name: 'Hutang Usaha', type: 'LIABILITY', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8200-000000000102', code: '2-1100', name: 'PPN Keluaran', type: 'LIABILITY', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8300-000000000101', code: '3-1000', name: 'Modal Disetor', type: 'EQUITY', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8400-000000000101', code: '4-1000', name: 'Pendapatan Penjualan', type: 'REVENUE', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8400-000000000102', code: '4-9000', name: 'Pendapatan Lain-lain', type: 'REVENUE', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8100-000000000105', code: '1-3000', name: 'Persediaan Barang Dagang', type: 'ASSET', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8400-000000000103', code: '4-9100', name: 'Keuntungan Penyesuaian Persediaan', type: 'REVENUE', normalBalance: 'CREDIT', isActive: true },
  { id: '00000000-0000-4000-8500-000000000101', code: '5-1000', name: 'Harga Pokok Penjualan', type: 'COGS', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000101', code: '6-1000', name: 'Beban Gaji & Tunjangan', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000102', code: '6-1100', name: 'Beban Sewa', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000103', code: '6-1200', name: 'Beban Listrik & Air', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000104', code: '6-1300', name: 'Beban Internet & Telepon', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000105', code: '6-1400', name: 'Beban Marketing', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000106', code: '6-1500', name: 'Beban Administrasi', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000107', code: '6-1600', name: 'Beban Transportasi', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000108', code: '6-1700', name: 'Beban Bank', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000199', code: '6-1900', name: 'Beban Operasional Lainnya', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
  { id: '00000000-0000-4000-8600-000000000195', code: '6-1950', name: 'Kerugian Penyesuaian Persediaan', type: 'EXPENSE', normalBalance: 'DEBIT', isActive: true },
];

const accountByCode = (code: string) => localAccounts.find(a => a.code === code);
const balanceFor = (a: Account, debit: number, credit: number) =>
  round2(a.normalBalance === 'DEBIT' ? debit - credit : credit - debit);

function localStatements(startDate: string, endDate: string): FinancialStatements {
  const invoices = StorageService.getInvoices().filter(i => i.status !== 'draft' && i.status !== 'cancelled');
  const payments = StorageService.getPayments();
  const expenses = getCachedExpenses().filter(e => e.status === 'POSTED');

  const lines = new Map<string, { debit: number; credit: number }>();
  const post = (code: string, debit: number, credit: number, date: string) => {
    if (date < startDate || date > endDate) return;
    const cur = lines.get(code) || { debit: 0, credit: 0 };
    cur.debit += debit; cur.credit += credit; lines.set(code, cur);
  };
  const postCumulative = (code: string, debit: number, credit: number, date: string) => {
    if (date > endDate) return;
    const cur = lines.get(`cum:${code}`) || { debit: 0, credit: 0 };
    cur.debit += debit; cur.credit += credit; lines.set(`cum:${code}`, cur);
  };

  invoices.forEach((i: Invoice) => {
    const revenue = Math.max(0, i.subtotal - i.discountAmount);
    post('1-2000', i.grandTotal, 0, i.issueDate);
    post('4-1000', revenue, 0, i.issueDate); // converted below using normal balance
    post('2-1100', 0, i.taxAmount, i.issueDate);
    if (i.additionalCharges > 0) post('4-9000', i.additionalCharges, 0, i.issueDate);
    // The helper stores raw debit/credit; revenue is intentionally credit-normalized.
    const r = lines.get('4-1000')!; r.debit -= revenue; r.credit += revenue;
    if (i.additionalCharges > 0) { const x = lines.get('4-9000')!; x.debit -= i.additionalCharges; x.credit += i.additionalCharges; }

    postCumulative('1-2000', i.grandTotal, 0, i.issueDate);
    postCumulative('4-1000', 0, revenue, i.issueDate);
    postCumulative('2-1100', 0, i.taxAmount, i.issueDate);
    if (i.additionalCharges > 0) postCumulative('4-9000', 0, i.additionalCharges, i.issueDate);
  });

  payments.forEach((p: Payment) => {
    const account = p.paymentMethod === 'cash'
      ? '1-1000'
      : (p.destinationBank || '').toLowerCase().includes('mandiri') ? '1-1200' : '1-1100';
    post(account, p.amount, 0, p.paymentDate);
    post('1-2000', 0, p.amount, p.paymentDate);
    postCumulative(account, p.amount, 0, p.paymentDate);
    postCumulative('1-2000', 0, p.amount, p.paymentDate);
  });

  expenses.forEach((e: Expense) => {
    (e.journal?.lines || []).forEach(l => {
      const a = localAccounts.find(x => x.id === l.accountId);
      if (a) { post(a.code, l.debit, l.credit, e.transactionDate); postCumulative(a.code, l.debit, l.credit, e.transactionDate); }
    });
    (e.payments || []).forEach(p => {
      const a = localAccounts.find(x => x.id === p.paymentAccountId);
      if (a) { post('2-1000', p.amount, 0, p.paymentDate); post(a.code, 0, p.amount, p.paymentDate); postCumulative('2-1000', p.amount, 0, p.paymentDate); postCumulative(a.code, 0, p.amount, p.paymentDate); }
    });
  });

  const inventoryMovements = StorageService.getInventoryMovements();
  inventoryMovements.forEach((m: any) => {
    const qty = Number(m.quantity || 0);
    const value = round2(Math.abs(qty) * Number(m.unitCost || 0));
    const type = m.movementType;
    if (!value) return;
    if (qty < 0 && type === 'SALE') {
      post('5-1000', value, 0, m.movementDate); post('1-3000', 0, value, m.movementDate);
      postCumulative('5-1000', value, 0, m.movementDate); postCumulative('1-3000', 0, value, m.movementDate);
    } else if (qty > 0 && ['PURCHASE','OPENING','RETURN_IN'].includes(type)) {
      const creditCode = type === 'PURCHASE' ? '2-1000' : type === 'OPENING' ? '3-1000' : '5-1000';
      post('1-3000', value, 0, m.movementDate); post(creditCode, 0, value, m.movementDate);
      postCumulative('1-3000', value, 0, m.movementDate); postCumulative(creditCode, 0, value, m.movementDate);
    } else if (qty > 0 && type === 'ADJUSTMENT_IN') {
      post('1-3000', value, 0, m.movementDate); post('4-9100', 0, value, m.movementDate);
      postCumulative('1-3000', value, 0, m.movementDate); postCumulative('4-9100', 0, value, m.movementDate);
    } else if (qty < 0 && type === 'ADJUSTMENT_OUT') {
      post('6-1950', value, 0, m.movementDate); post('1-3000', 0, value, m.movementDate);
      postCumulative('6-1950', value, 0, m.movementDate); postCumulative('1-3000', 0, value, m.movementDate);
    }
  });

  const makeLines = (types: string[], source: Map<string, { debit: number; credit: number }>, cumulative = false): AccountingLine[] =>
    localAccounts.filter(a => types.includes(a.type)).map(a => ({ code: a.code, name: a.name, accountType: a.type, amount: balanceFor(a, source.get(`${cumulative ? 'cum:' : ''}${a.code}`)?.debit || 0, source.get(`${cumulative ? 'cum:' : ''}${a.code}`)?.credit || 0) })).filter(x => Math.abs(x.amount) > 0.004);

  const revenue = makeLines(['REVENUE'], lines);
  const cogs = makeLines(['COGS'], lines);
  const expensesLines = makeLines(['EXPENSE'], lines);
  const totalRevenue = revenue.reduce((s, x) => s + x.amount, 0);
  const totalCogs = cogs.reduce((s, x) => s + x.amount, 0);
  const totalExpenses = expensesLines.reduce((s, x) => s + x.amount, 0);
  const netProfit = round2(totalRevenue - totalCogs - totalExpenses);

  const assets = makeLines(['ASSET'], lines, true);
  const liabilities = makeLines(['LIABILITY'], lines, true);
  const equityActual = makeLines(['EQUITY'], lines, true);
  const priorRevenue = makeLines(['REVENUE'], lines, true).reduce((s, x) => s + x.amount, 0);
  const priorCogs = makeLines(['COGS'], lines, true).reduce((s, x) => s + x.amount, 0);
  const priorExpenses = makeLines(['EXPENSE'], lines, true).reduce((s, x) => s + x.amount, 0);
  const cumulativeProfit = round2(priorRevenue - priorCogs - priorExpenses);
  const equity = [...equityActual, { code: '3-9999', name: 'Laba Ditahan / Laba Berjalan', accountType: 'EQUITY', amount: cumulativeProfit }];
  const totalAssets = assets.reduce((s, x) => s + x.amount, 0);
  const totalLiabilities = liabilities.reduce((s, x) => s + x.amount, 0);
  const totalEquity = equity.reduce((s, x) => s + x.amount, 0);
  const cashCodes = ['1-1000', '1-1100', '1-1200'];
  // Opening cash is the cumulative cash/bank balance immediately before
  // the selected reporting period. This makes the local/demo engine behave
  // like the Supabase ledger instead of always starting from zero.
  const openingCash = cashCodes.reduce((s, code) => {
    const a = accountByCode(code)!;
    const v = lines.get(`cum:${code}`) || { debit: 0, credit: 0 };
    const periodMovement = lines.get(code) || { debit: 0, credit: 0 };
    return s + balanceFor(a, v.debit - periodMovement.debit, v.credit - periodMovement.credit);
  }, 0);
  const cashMovement = [...lines.entries()].filter(([k]) => cashCodes.includes(k)).reduce((s, [k, v]) => s + v.debit - v.credit, 0);
  const cashCumulative = cashCodes.reduce((s, code) => {
    const a = accountByCode(code)!; const v = lines.get(`cum:${code}`) || { debit: 0, credit: 0 }; return s + balanceFor(a, v.debit, v.credit);
  }, 0);
  const inflows = [...lines.entries()].filter(([k]) => cashCodes.includes(k)).reduce((s, [, v]) => s + v.debit, 0);
  const outflows = [...lines.entries()].filter(([k]) => cashCodes.includes(k)).reduce((s, [, v]) => s + v.credit, 0);

  return {
    period: { startDate, endDate },
    profitLoss: { revenue, cogs, expenses: expensesLines, totalRevenue, totalCogs, totalExpenses, netProfit },
    balanceSheet: { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, balanceCheck: round2(totalAssets - totalLiabilities - totalEquity) },
    cashFlow: { openingCash: round2(cashCumulative - cashMovement), inflows: round2(inflows), outflows: round2(outflows), netCashFlow: round2(inflows - outflows), closingCash: round2(cashCumulative) },
    receivables: { balance: balanceFor(accountByCode('1-2000')!, (lines.get('cum:1-2000')?.debit || 0), (lines.get('cum:1-2000')?.credit || 0)) },
    payables: { balance: balanceFor(accountByCode('2-1000')!, (lines.get('cum:2-1000')?.debit || 0), (lines.get('cum:2-1000')?.credit || 0)) },
    integrity: {
      postedJournals: invoices.filter(i => i.issueDate <= endDate).length +
        payments.filter(p => p.paymentDate <= endDate).length +
        expenses.filter(e => e.transactionDate <= endDate).length +
        inventoryMovements.filter((m: any) => m.movementDate <= endDate && Number(m.quantity || 0) !== 0).length,
      unbalancedJournals: 0,
      debitTotal: round2([...lines.values()].reduce((s, v) => s + v.debit, 0)),
      creditTotal: round2([...lines.values()].reduce((s, v) => s + v.credit, 0)),
      unjournalizedInvoices: 0,
      unjournalizedPayments: 0,
      unmappedBankPayments: 0
    },
  };
}

export class AccountingService {
  static async getFinancialStatements(startDate: string, endDate: string, orgId?: string): Promise<FinancialStatements> {
    if (isSupabaseConfigured && orgId) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const { data, error } = await supabase.rpc('get_financial_statements' as any, { p_start_date: startDate, p_end_date: endDate });
          if (error) throw new Error(error.message);
          if (data) return data as FinancialStatements;
        }
      } catch (e) {
        // Production/authenticated mode must never reconstruct accounting from
        // invoice/payment UI caches. Financial reports are derived from the
        // canonical posted journal data in Postgres.
        console.error('[AccountingService] Laporan canonical Postgres gagal dimuat:', e);
        throw e;
      }
    }
    // Local calculation is only for explicit demo/offline mode.
    return localStatements(startDate, endDate);
  }
}
