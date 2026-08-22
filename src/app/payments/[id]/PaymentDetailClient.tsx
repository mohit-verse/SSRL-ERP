'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';

interface Props {
  payment: any;
  userRole: UserRole;
}

export default function PaymentDetailClient({ payment: initialPayment, userRole }: Props) {
  const [payment, setPayment] = useState(initialPayment);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleCancelPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/payments/${payment.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to cancel payment.');
        return;
      }

      setPayment((prev: any) => ({ ...prev, status: 'CANCELLED', cancellation_reason: reason }));
      setSuccessMsg('Payment successfully cancelled and allocations reversed.');
      setShowCancelModal(false);
    } catch {
      setErrorMsg('Network error cancelling payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <a href="/payments" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Payments</a>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            Payment Record: <span style={{ color: 'var(--accent-primary)' }}>{payment.payment_number}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={`badge ${payment.status === 'ACTIVE' ? 'badge-delivered' : 'badge-cancelled'}`}>
            {payment.status}
          </span>

          {isSuperAdmin && payment.status === 'ACTIVE' && (
            <button onClick={() => setShowCancelModal(true)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancel & Reverse Payment
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Payment Identity</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Payment Type:</strong> {payment.payment_type}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Payment Date:</strong> {new Date(payment.payment_date).toLocaleDateString()}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Payment Mode:</strong> {payment.payment_mode}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Reference UTR:</strong> {payment.reference_number || '—'}</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Target Entity</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Party:</strong> {payment.parties?.name || '—'}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Vehicle Owner:</strong> {payment.vehicle_owners?.name || '—'}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Trip #:</strong> {payment.trips?.trip_number || '— (Bulk / FIFO)'}</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Financial Totals</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            ₹{payment.amount.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Recorded By: {payment.created_by}
          </p>
        </div>
      </div>

      {/* Payment Allocation Breakdown Ledger */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Payment Allocation Junction Ledger</h3>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Allocation ID</th>
              <th>Trip #</th>
              <th>Loading Date</th>
              <th>Allocated Amount (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(payment.payment_allocations || []).length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No allocations linked.</td></tr>
            ) : (
              (payment.payment_allocations || []).map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{a.id.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{a.trips?.trip_number || '—'}</td>
                  <td>{a.trips?.loading_date ? new Date(a.trips.loading_date).toLocaleDateString() : '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{a.amount_allocated.toLocaleString()}</td>
                  <td><span className={`badge ${a.status === 'ACTIVE' ? 'badge-delivered' : 'badge-cancelled'}`}>{a.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generated Party Credit Details */}
      {(payment.party_credits || []).length > 0 && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>Generated Party Credit</h3>
          {(payment.party_credits || []).map((c: any) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem' }}><strong>Original Credit:</strong> ₹{c.original_credit.toLocaleString()}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>Amount Used:</strong> ₹{c.amount_used.toLocaleString()}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>Remaining Credit:</strong> ₹{c.remaining_credit.toLocaleString()}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>Credit Status:</strong> <span className="badge badge-transit">{c.status}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation & Reversal Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--status-cancelled)' }}>Revert & Cancel Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Warning: Cancelling this payment will reverse all linked allocations, party credits, and credit usages, restoring trip outstanding balances.
            </p>

            <form onSubmit={handleCancelPayment}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Mandatory Cancellation Reason *</label>
                <textarea required rows={3} placeholder="Incorrect reference UTR or cheque bounced" value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCancelModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--status-cancelled)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  {loading ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
