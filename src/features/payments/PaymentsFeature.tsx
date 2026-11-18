import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Download, CheckCircle2, AlertTriangle, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { downloadInvoicePdf } from '../../lib/pdf';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { PaymentRecord, InvoiceRecord } from '../../types/platform';

export function PaymentsFeature() {
  const { user, razorpayConfigured, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const pay = await apiFetch<{ payments: PaymentRecord[]; invoices: InvoiceRecord[] }>(
        '/api/workspace/payments'
      );
      setPayments(pay.payments);
      setInvoices(pay.invoices);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load billing records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleRazorpayPay = async (payment: PaymentRecord) => {
    try {
      const order = await apiFetch<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        paymentCode: string;
      }>('/api/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ paymentId: payment.id }),
      });

      const win = window as unknown as {
        Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
      };
      if (!win.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay Checkout SDK.'));
          document.body.appendChild(script);
        });
      }

      if (!win.Razorpay) {
        throw new Error('Razorpay SDK unavailable.');
      }

      const rzp = new win.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Sanjay Vaishya',
        description: `Project Payment ${order.paymentCode}`,
        order_id: order.orderId,
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await apiFetch<{ invoiceNumber: string }>('/api/payments/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                paymentId: payment.id,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              }),
            });
            showToast(`Payment verified. Invoice ${verified.invoiceNumber} issued.`);
            loadBilling();
          } catch (verifyErr) {
            showToast(verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#ED1C24' },
      });
      rzp.open();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout unavailable.', 'error');
    }
  };

  if (loading && payments.length === 0 && invoices.length === 0) return <LoadingSkeleton rows={2} />;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#262B38] space-y-1">
        <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          MILESTONE BILLING &amp; RECEIPTS
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Payments &amp; Invoices</h1>
      </div>

      {!razorpayConfigured && (
        <div className="p-4 rounded-lg bg-[#1A1E28] border border-[#ED1C24]/40 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Razorpay Live Gateway Not Configured</p>
            <p className="text-[#CCCCCC]">
              Online checkout activates automatically once merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are configured on the server.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <h2 className="text-base font-bold text-white">Payment Schedule</h2>
        {payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment requests yet"
            description="Advance, milestone, and balance payments appear here once scheduled."
          />
        ) : (
          <div className="space-y-3">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-mono text-[11px] text-[#00BFFF] tabular-nums">
                    {pay.payment_code} · {pay.payment_type.toUpperCase()}
                  </p>
                  <p className="text-sm font-bold text-white">{pay.project_title || 'Development Project'}</p>
                  <p className="font-mono text-xs text-[#C0C0C0] tabular-nums">
                    INR {pay.amount_inr.toLocaleString('en-IN')} · Status: {pay.status}
                  </p>
                </div>
                {pay.status !== 'successful' ? (
                  <button
                    type="button"
                    disabled={!razorpayConfigured}
                    onClick={() => handleRazorpayPay(pay)}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-40 text-white text-xs font-semibold"
                  >
                    {razorpayConfigured ? 'Pay with Razorpay' : 'Gateway Pending Keys'}
                  </button>
                ) : (
                  <span className="font-mono text-xs text-[#00CC66] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <h2 className="text-base font-bold text-white">Issued Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices issued yet"
            description="Verified payment receipts generate downloadable invoices automatically."
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-mono text-xs text-[#00CC66] tabular-nums">{inv.invoice_number}</p>
                  <p className="text-sm font-bold text-white">{inv.project_title || 'Project Invoice'}</p>
                  <p className="font-mono text-xs text-[#C0C0C0] tabular-nums">
                    INR {inv.amount_inr.toLocaleString('en-IN')} · Issued {inv.issued_at.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(inv)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[#00BFFF]" />
                  Download Invoice PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
