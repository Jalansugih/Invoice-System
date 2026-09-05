import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const serverKey = String(process.env.MIDTRANS_SERVER_KEY || '').trim();
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!serverKey || !url || !serviceKey) return res.status(500).json({ message: 'Server belum dikonfigurasi.' });
  const body = req.body || {};
  const expected = crypto.createHash('sha512').update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`).digest('hex');
  if (!body.signature_key || body.signature_key !== expected) return res.status(401).json({ message: 'Signature tidak valid.' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const status = String(body.transaction_status || 'pending');
  const { data: tx } = await admin.from('payment_gateway_transactions').select('id,organization_id,invoice_id,gross_amount,status').eq('order_id', body.order_id).maybeSingle();
  if (!tx) return res.status(404).json({ message: 'Transaksi gateway tidak ditemukan.' });
  const normalized = status === 'settlement' || (status === 'capture' && String(body.fraud_status || 'accept').toLowerCase() === 'accept') ? 'paid' : status === 'expire' ? 'expired' : status === 'cancel' ? 'cancelled' : status === 'deny' || status === 'failure' ? 'failed' : 'pending';

  const { error } = await admin.rpc('record_gateway_payment_atomic' as any, {
    p_gateway_transaction_id: tx.id,
    p_provider_status: status,
    p_payment_type: String(body.payment_type || 'other'),
    p_reference_number: String(body.transaction_id || body.order_id),
    p_amount: Number(body.gross_amount || tx.gross_amount),
    p_paid_at: body.settlement_time || body.transaction_time || new Date().toISOString(),
  });
  if (error) return res.status(500).json({ message: error.message });
  return res.status(200).json({ ok: true, status: normalized });
}
