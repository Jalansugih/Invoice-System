import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = ['.env.example','tests/invoiceCalc.test.ts','supabase/tests/rls_role_regression.sql','supabase/migration_v28_production_hardening.sql'];
const missing = required.filter((p) => !fs.existsSync(p));
if (missing.length) throw new Error(`Missing production hardening files: ${missing.join(', ')}`);
const read = (p) => fs.readFileSync(p, 'utf8');
const checks = [
  ['Customer pagination is wired', read('src/components/customers/CustomerList.tsx').includes('fetchCustomersPage(')],
  ['Product pagination is wired', read('src/components/products/ProductList.tsx').includes('fetchProductsPage(')],
  ['Invoice pagination is wired', read('src/components/invoices/InvoiceList.tsx').includes('fetchInvoicesPage(')],
  ['Invoice role gating is wired', read('src/components/invoices/InvoiceList.tsx').includes("canPerformAction('delete_records')")],
  ['Payment role gating is wired', read('src/components/payments/PaymentList.tsx').includes("canPerformAction('record_payment')")],
  ['Purchase role gating is wired', read('src/components/purchases/PurchaseList.tsx').includes("canPerformAction('create_draft')")],
  ['Settings role gating is wired', read('src/components/settings/SettingsView.tsx').includes("canPerformAction('org_settings')")],
  ['Customer role gating is wired', read('src/components/customers/CustomerList.tsx').includes("canPerformAction('edit_all')")],
  ['Product role gating is wired', read('src/components/products/ProductList.tsx').includes("canPerformAction('edit_all')")],
  ['Legacy duplicate permission system removed', !fs.existsSync('src/lib/permissions.ts') && !fs.existsSync('src/components/common/PermissionGate.tsx')],
  ['Expense service does not silently fallback on Supabase errors', !read('src/lib/expenseService.ts').includes("console.error('ExpenseService.list:', e)")],
];
const failed = checks.filter(([,ok]) => !ok).map(([name]) => name);
if (failed.length) throw new Error(`Production wiring checks failed: ${failed.join(', ')}`);
console.log('Production hardening wiring: OK');
try { execFileSync('tsc', ['--noEmit'], { stdio: 'inherit' }); } catch { process.exit(1); }
