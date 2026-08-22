'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, TripStatus } from '@/lib/types';

interface Props {
  trip: any;
  userRole: UserRole;
}

export default function TripDetailClient({ trip: initialTrip, userRole }: Props) {
  const [trip, setTrip] = useState(initialTrip);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const isReadOnly = userRole === 'CA_AUDITOR';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleStatusTransition = async (targetStatus: TripStatus) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_status: targetStatus,
          change_reason: `Transitioned to ${targetStatus} via Trip Control`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update trip status.');
        return;
      }

      setTrip((prev: any) => ({ ...prev, trip_status: targetStatus }));
      setSuccessMsg(`Trip status successfully updated to ${targetStatus}.`);
    } catch {
      setErrorMsg('Network error updating status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!window.confirm('Are you sure you want to soft-delete this trip?')) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to soft-delete trip.');
        return;
      }

      router.push('/trips');
    } catch {
      setErrorMsg('Network error soft-deleting trip.');
    } finally {
      setLoading(false);
    }
  };

  const partyFin = trip.trip_party_financials?.[0] || {};
  const ownerFin = trip.trip_owner_financials?.[0] || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <a href="/trips" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Trips</a>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            Trip Detail: <span style={{ color: 'var(--accent-primary)' }}>{trip.trip_number}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-transit">{trip.trip_status}</span>
          {isSuperAdmin && !trip.is_deleted && (
            <button onClick={handleSoftDelete} disabled={loading} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Soft Delete Trip
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

      {/* Lifecycle Status Transitions */}
      {!isReadOnly && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lifecycle Status Control
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {trip.trip_status === 'PLANNED' && (
              <>
                <button onClick={() => handleStatusTransition('IN_TRANSIT')} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Mark IN TRANSIT</button>
                <button onClick={() => handleStatusTransition('CANCELLED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel Trip</button>
              </>
            )}

            {trip.trip_status === 'IN_TRANSIT' && (
              <>
                <button onClick={() => handleStatusTransition('DELIVERED')} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Mark DELIVERED</button>
                <button onClick={() => handleStatusTransition('CANCELLED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel Trip</button>
              </>
            )}

            {trip.trip_status === 'DELIVERED' && isSuperAdmin && (
              <button onClick={() => handleStatusTransition('SETTLED')} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Mark SETTLED (SUPER_ADMIN)</button>
            )}

            {trip.trip_status === 'SETTLED' && isSuperAdmin && (
              <button onClick={() => handleStatusTransition('DELIVERED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Revert to DELIVERED</button>
            )}
          </div>
        </div>
      )}

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Trip & Vehicle Specs</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Loading Date:</strong> {new Date(trip.loading_date).toLocaleDateString()}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Loading Origin:</strong> {trip.loading_location}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Vehicle No:</strong> {trip.vehicles?.vehicle_number} ({trip.vehicles?.ownership_type})</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Driver:</strong> {trip.drivers?.name || '—'}</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Party & Documentation</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Consignor:</strong> {trip.parties?.name}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>LR Number:</strong> {trip.lr_number || '—'}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Invoice Number:</strong> {trip.invoice_number || '—'}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Remarks:</strong> {trip.remarks || '—'}</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>Financial Initializer</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Party Freight:</strong> ₹{(partyFin.freight || 0).toLocaleString()}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Unloading Charge Total:</strong> ₹{(partyFin.unloading_charges || 0).toLocaleString()}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Gross Receivable:</strong> ₹{(partyFin.gross_receivable || 0).toLocaleString()}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><strong>Net Receivable:</strong> ₹{(partyFin.net_receivable || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Multi-Destinations Breakdown */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Multi-Destination Route Unloading Charges</h3>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Seq #</th>
              <th>Destination Name</th>
              <th>Unloading Charge (₹)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(trip.trip_destinations || []).map((d: any) => (
              <tr key={d.id || d.sequence_order}>
                <td style={{ fontWeight: 600 }}>#{d.sequence_order}</td>
                <td>{d.destination_name}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>₹{d.unloading_charge.toLocaleString()}</td>
                <td>{d.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
