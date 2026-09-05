import { Invoice } from '../types';

export interface PaymentGatewayConfig {
  provider: string;
  apiBaseUrl: string;
  publicKey?: string;
  enabled: boolean;
}

export interface PaymentLinkResult {
  paymentUrl: string;
  transactionId?: string;
  expiresAt?: string;
  status?: string;
}

/**
 * Thin frontend adapter for the payment gateway backend.
 *
 * The browser must never receive a Midtrans/server secret. Configure
 * VITE_PAYMENT_GATEWAY_API_URL to point at a trusted backend/Edge Function
 * that creates the provider transaction and returns a public payment URL.
 */
export class PaymentGatewayService {
  static getConfig(): PaymentGatewayConfig {
    const apiBaseUrl = (import.meta.env.VITE_PAYMENT_GATEWAY_API_URL || '').trim();
    const provider = (import.meta.env.VITE_PAYMENT_GATEWAY_PROVIDER || 'midtrans').trim();
    const publicKey = (import.meta.env.VITE_PAYMENT_GATEWAY_PUBLIC_KEY || '').trim() || undefined;
    return { provider, apiBaseUrl, publicKey, enabled: Boolean(apiBaseUrl) };
  }

  static async createPaymentLink(invoice: Invoice): Promise<PaymentLinkResult> {
    const config = this.getConfig();
    if (!config.apiBaseUrl) {
      throw new Error(
        'Payment Gateway belum dikonfigurasi. Set VITE_PAYMENT_GATEWAY_API_URL ke backend/Edge Function yang membuat transaksi gateway.'
      );
    }

    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: invoice.outstandingAmount,
        currency: 'IDR',
        description: `Pembayaran ${invoice.invoiceNumber}`,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || `Gateway gagal membuat link pembayaran (${response.status}).`);
    }
    if (!payload?.paymentUrl) {
      throw new Error('Backend gateway tidak mengembalikan paymentUrl.');
    }
    return payload as PaymentLinkResult;
  }
}
