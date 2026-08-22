'use client';

import React, { useState, useEffect } from 'react';
import { Party, VehicleOwner, UserRole, PaymentType, PaymentMode, PaymentStatus } from '@/lib/types';

interface Props {
  parties: Party[];
  owners: VehicleOwner[];
  trips: any[];
  userRole: UserRole;
}

export default function PaymentsClient({ parties, owners, trips, userRole }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Modal & Two-Step Workflow
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment Form Fields
  const [paymentType, setPaymentType] = useState<PaymentType>('PARTY_ADVANCE');
  const [partyId, setPartyId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [tripId, setTripId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, statusFilter, typeFilter]);

  const isOwnerPayment = paymentType.startsWith('VEHICLE_OWNER_');
  const isBulkPayment = paymentType === 'BULK_PAYMENT';

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if ((paymentMode === 'UPI' || paymentMode === 'BANK_TRANSFER' || paymentMode === 'CHEQUE') && !referenceNumber.trim()) {
      setErrorMsg(`Reference number is required for ${paymentMode}.`);
      return;
    }

    setStep(2); // Proceed to Step 2 Confirmation Summary
  };

  const handleFinalConfirm = async () => {
    setErrorMsg(null);
    setLoading(true);

    const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          payment_type: paymentType,
          party_id: isOwnerPayment ? undefined : partyId,
          vehicle_owner_id: isOwnerPayment ? ownerId : undefined,
          trip_id: isBulkPayment ? undefined : tripId,
          amount: Number(amount),
          payment_mode: paymentMode,
          reference_number: referenceNumber ? referenceNumber.trim() : undefined,
          payment_date: paymentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record payment.');
        setStep(1);
        return;
      }

      setShowModal(false);
      setStep(1);
      setAmount(0);
      setReferenceNumber('');
      fetchPayments();
    } catch {
      setErrorMsg('Network error recording payment.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: '1', minWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search payment # or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1',
              padding: '0.75rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {!isReadOnly && (
          <button className="btn-primary" onClick={() => { setShowModal(true); setStep(1); }}>
            + Record New Payment
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Payment #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Target Entity</th>
            <th>Amount (₹)</th>
            <th>Mode / UTR</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading payment ledger...</td></tr>
          ) : payments.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No payment records found.</td></tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} style={{ opacity: p.status === 'CANCELLED' ? 0.6 : 1 }}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{p.payment_number}</td>
                <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                <td><span className="badge badge-planned">{p.payment_type}</span></td>
                <td>{p.parties?.name || p.vehicle_owners?.name || '—'}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{p.amount.toLocaleString()}</td>
                <td>{p.payment_mode} {p.reference_number ? `(${p.reference_number})` : ''}</td>
                <td>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'badge-delivered' : 'badge-cancelled'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <a href={`/payments/${p.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    View Breakdown →
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '580px', padding: '2rem' }}>
            
            {step === 1 ? (
              <>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Step 1: Enter Payment Details</h2>

                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleStep1Submit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Payment Type *</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                      <option value="PARTY_ADVANCE">PARTY_ADVANCE</option>
                      <option value="PARTY_BALANCE">PARTY_BALANCE</option>
                      <option value="PARTY_DETENTION">PARTY_DETENTION</option>
                      <option value="BULK_PAYMENT">BULK_PAYMENT (FIFO Allocation & Party Credit)</option>
                      <option value="VEHICLE_OWNER_ADVANCE">VEHICLE_OWNER_ADVANCE</option>
                      <option value="VEHICLE_OWNER_BALANCE">VEHICLE_OWNER_BALANCE</option>
                      <option value="VEHICLE_OWNER_DETENTION">VEHICLE_OWNER_DETENTION</option>
                    </select>
                  </div>

                  {!isOwnerPayment ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Party (Consignor) *</label>
                      <select required value={partyId} onChange={(e) => setPartyId(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                        <option value="">Select Party</option>
                        {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Vehicle Owner *</label>
                      <select required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                        <option value="">Select Vehicle Owner</option>
                        {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  )}

                  {!isBulkPayment && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Trip *</label>
                      <select required value={tripId} onChange={(e) => setTripId(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                        <option value="">Select Target Trip</option>
                        {trips.map((t) => <option key={t.id} value={t.id}>{t.trip_number} ({t.loading_date})</option>)}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Payment Amount (₹) *</label>
                      <input required type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Payment Date *</label>
                      <input required type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Payment Mode *</label>
                      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                        <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">CHEQUE</option>
                        <option value="CASH">CASH</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Reference / UTR / Cheque #</label>
                      <input type="text" placeholder="UTR123456789" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Proceed to Summary →</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Step 2: Mandatory Confirmation Summary</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Please review financial details carefully. Once recorded, payments are immutable and require SUPER_ADMIN reversal to alter.
                </p>

                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Payment Type:</strong> <span className="badge badge-planned">{paymentType}</span></p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Target Entity:</strong> {parties.find((p) => p.id === partyId)?.name || owners.find((o) => o.id === ownerId)?.name}</p>
                  {!isBulkPayment && <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Trip:</strong> {trips.find((t) => t.id === tripId)?.trip_number}</p>}
                  <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700 }}><strong>Amount:</strong> ₹{amount.toLocaleString()}</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Mode:</strong> {paymentMode} {referenceNumber ? `(${referenceNumber})` : ''}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Date:</strong> {paymentDate}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>← Back to Edit</button>
                  <button type="button" onClick={handleFinalConfirm} disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                    {loading ? 'Processing Ledger...' : 'CONFIRM & POST PAYMENT'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
