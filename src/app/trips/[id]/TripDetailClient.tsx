'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, TripStatus, Driver } from '@/lib/types';
import TripDocumentsSection from './TripDocumentsSection';
import EditTripModal from './EditTripModal';

interface Props {
  trip: any;
  allocations: any[];
  activeBill: any | null;
  documents: any[];
  auditLogs: any[];
  drivers?: Driver[];
  userRole: UserRole;
}

export default function TripDetailClient({
  trip: initialTrip,
  allocations,
  activeBill,
  documents,
  auditLogs,
  drivers = [],
  userRole,
}: Props) {
  const [trip, setTrip] = useState(initialTrip);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setSuccessMsg('Trip details successfully updated.');
    try {
      const res = await fetch(`/api/trips/${trip.id}`);
      const data = await res.json();
      if (res.ok && data.trip) {
        setTrip(data.trip);
      }
    } catch {
      // Fallback
    }
  };

  const isReadOnly = userRole === 'CA_AUDITOR';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'PLANNED':
        return <span className="badge badge-planned">PLANNED</span>;
      case 'IN_TRANSIT':
        return <span className="badge badge-transit">IN TRANSIT</span>;
      case 'DELIVERED':
        return <span className="badge badge-delivered">DELIVERED</span>;
      case 'SETTLED':
        return <span className="badge badge-settled">SETTLED</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">CANCELLED</span>;
      default:
        return <span className="badge badge-planned">{status}</span>;
    }
  };

  const handleStatusTransition = async (targetStatus: TripStatus) => {
    if (targetStatus === 'CANCELLED' && !window.confirm('Are you sure you want to cancel this trip?')) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_status: targetStatus,
          change_reason: `Transitioned to ${targetStatus} via Trip Control Panel`,
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
      setErrorMsg('Network connectivity error updating trip status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreTrip = async () => {
    if (!window.confirm('Are you sure you want to restore this soft-deleted trip?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to restore trip.');
        return;
      }

      setTrip((prev: any) => ({ ...prev, is_deleted: false }));
      setSuccessMsg('Trip has been successfully restored.');
    } catch {
      setErrorMsg('Network error restoring trip.');
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
  const isMarketVehicle = trip.vehicles?.ownership_type === 'MARKET';
  const destinations = trip.trip_destinations || [];

  // Separate allocations into Party vs Owner
  const partyAllocations = allocations.filter(
    (a) => a.payments?.payment_type && ['PARTY_ADVANCE', 'PARTY_BALANCE', 'PARTY_DETENTION'].includes(a.payments.payment_type)
  );
  const ownerAllocations = allocations.filter(
    (a) => a.payments?.payment_type && ['VEHICLE_OWNER_ADVANCE', 'VEHICLE_OWNER_BALANCE', 'VEHICLE_OWNER_DETENTION'].includes(a.payments.payment_type)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Page Header */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <a
              href="/trips"
              style={{
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.5rem',
              }}
            >
              ← Back to Operational Trips
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Trip Details: <span style={{ color: 'var(--accent-primary)' }}>{trip.trip_number}</span>
              </h1>
              {getStatusBadge(trip.trip_status)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Consignor: <strong>{trip.parties?.name || '—'}</strong> • Vehicle: <strong>{trip.vehicles?.vehicle_number || '—'}</strong> ({trip.vehicles?.ownership_type || '—'}) • Loading: <strong>{new Date(trip.loading_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isReadOnly && !trip.is_deleted && (
              <button
                className="btn-primary"
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Edit Trip ✏️
              </button>
            )}

            {trip.is_deleted && isSuperAdmin && (
              <button
                onClick={handleRestoreTrip}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid var(--status-delivered)',
                  color: 'var(--status-delivered)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Restore Deleted Trip
              </button>
            )}

            {!trip.is_deleted && isSuperAdmin && (
              <button
                onClick={handleSoftDelete}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--status-cancelled)',
                  color: 'var(--status-cancelled)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Soft Delete Trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {trip.is_deleted && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--status-cancelled)',
            color: 'var(--status-cancelled)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <div>THIS TRIP HAS BEEN SOFT-DELETED</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 400, marginTop: '0.15rem' }}>
              Normal operational mutations are restricted. Only SUPER_ADMIN can restore this record.
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* 2. Lifecycle Status Control Panel */}
      {!isReadOnly && !trip.is_deleted && (
        <div className="glass-card" style={{ padding: '1.25rem 1.75rem' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.85rem', fontWeight: 700 }}>
            Operational Status Mutation Panel
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {trip.trip_status === 'PLANNED' && (
              <>
                <button disabled={loading} onClick={() => handleStatusTransition('IN_TRANSIT')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Mark IN TRANSIT →
                </button>
                <button disabled={loading} onClick={() => handleStatusTransition('CANCELLED')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel Trip
                </button>
              </>
            )}

            {trip.trip_status === 'IN_TRANSIT' && (
              <>
                <button disabled={loading} onClick={() => handleStatusTransition('DELIVERED')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Mark DELIVERED →
                </button>
                <button disabled={loading} onClick={() => handleStatusTransition('CANCELLED')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel Trip
                </button>
              </>
            )}

            {trip.trip_status === 'DELIVERED' && isSuperAdmin && (
              <button disabled={loading} onClick={() => handleStatusTransition('SETTLED')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Mark SETTLED (SUPER_ADMIN)
              </button>
            )}

            {trip.trip_status === 'SETTLED' && isSuperAdmin && (
              <button disabled={loading} onClick={() => handleStatusTransition('DELIVERED')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                Revert to DELIVERED
              </button>
            )}

            {trip.trip_status === 'CANCELLED' && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This trip is CANCELLED. No further operational status transitions permitted.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Trip Operational Overview */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1.25rem', fontWeight: 700 }}>
          Trip Operational Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Trip Number</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{trip.trip_number}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Loading Date</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {new Date(trip.loading_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Consignor Party</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{trip.parties?.name || '—'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Vehicle & Ownership</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {trip.vehicles?.vehicle_number} ({trip.vehicles?.ownership_type})
            </strong>
          </div>

          {isMarketVehicle && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>External Vehicle Owner</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--status-planned)' }}>
                {trip.vehicle_owners?.name || '—'}
              </strong>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Assigned Driver</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{trip.drivers?.name || '—'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>LR Number</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{trip.lr_number || '—'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Invoice Number</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{trip.invoice_number || '—'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Loading Location</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{trip.loading_location}</strong>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Operational Remarks</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{trip.remarks || 'No operational remarks recorded.'}</span>
          </div>
        </div>
      </div>

      {/* 4. Route & Destinations */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', fontWeight: 700 }}>
          Route Destinations & Unloading Breakdown
        </h3>

        {/* Visual Route Path */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ color: 'var(--accent-primary)' }}>{trip.loading_location}</strong>
          {destinations.map((d: any, idx: number) => (
            <React.Fragment key={d.id || idx}>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ background: 'var(--bg-surface-hover)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                Stop #{d.sequence_order}: {d.destination_name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Destinations Table */}
        {destinations.length > 0 ? (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Destination Stop</th>
                <th>Unloading Charge</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((d: any) => (
                <tr key={d.id || d.sequence_order}>
                  <td style={{ fontWeight: 700 }}>#{d.sequence_order}</td>
                  <td style={{ fontWeight: 600 }}>{d.destination_name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--status-delivered)' }}>
                    {formatCurrency(d.unloading_charge)}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No specific destination stops registered.
          </div>
        )}
      </div>

      {/* 5. Financial Summary (Party vs Owner) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Party Financials */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--status-delivered)', marginBottom: '1.25rem', fontWeight: 700 }}>
            Consignor Party Financials
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Base Freight Rate</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(partyFin.freight)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Unloading Charges</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(partyFin.unloading_charges)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Detention Charges</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(partyFin.detention_charges)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Additional Charges</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(partyFin.additional_charges)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Gross Receivable</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(partyFin.gross_receivable)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--status-cancelled)' }}>Total Deductions</span>
              <span style={{ color: 'var(--status-cancelled)' }}>- {formatCurrency(partyFin.shortage_deduction + partyFin.damage_deduction + partyFin.penalty_deduction + partyFin.other_deduction)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>TDS Deduction</span>
              <span style={{ color: 'var(--text-muted)' }}>- {formatCurrency(partyFin.tds_amount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-glow)', paddingTop: '0.65rem', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Net Receivable</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--status-delivered)' }}>{formatCurrency(partyFin.net_receivable)}</strong>
            </div>
          </div>
        </div>

        {/* Owner Financials */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--status-planned)', marginBottom: '1.25rem', fontWeight: 700 }}>
            Vehicle Owner Financials
          </h3>

          {isMarketVehicle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Owner Agreed Freight</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(ownerFin.owner_freight)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detention</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(ownerFin.detention_amount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Additional Charges</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(ownerFin.additional_charges)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--status-cancelled)' }}>Total Deductions</span>
                <span style={{ color: 'var(--status-cancelled)' }}>- {formatCurrency(ownerFin.deduction_amount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-glow)', paddingTop: '0.65rem', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Net Payable</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--status-planned)' }}>{formatCurrency(ownerFin.net_payable)}</strong>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="badge badge-transit" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                OWN FLEET — IN-HOUSE OPERATIONAL VEHICLE
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No external vehicle owner freight or payables apply to SSRL company-owned vehicles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Payment Allocations Summary */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1.25rem', fontWeight: 700 }}>
          Payment Allocations Ledger
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Party Payments */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--status-delivered)', marginBottom: '0.75rem', fontWeight: 700 }}>
              Party Payments Allocated
            </h4>
            {partyAllocations.length > 0 ? (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {partyAllocations.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{a.payments?.payment_type}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(a.payments?.payment_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--status-delivered)' }}>{formatCurrency(a.amount_allocated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.75rem 0' }}>No party payment allocations recorded.</div>
            )}
          </div>

          {/* Owner Payments */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--status-planned)', marginBottom: '0.75rem', fontWeight: 700 }}>
              Vehicle Owner Payments Allocated
            </h4>
            {ownerAllocations.length > 0 ? (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerAllocations.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{a.payments?.payment_type}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(a.payments?.payment_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--status-planned)' }}>{formatCurrency(a.amount_allocated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.75rem 0' }}>No vehicle owner payment allocations recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Billing Summary */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1rem', fontWeight: 700 }}>
          Billing Metadata Status
        </h3>

        {activeBill ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Bill Number</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{activeBill.bill_number}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Bill Status</span>
              <span className="badge badge-transit">{activeBill.status}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Total Bill Amount</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(activeBill.total_amount)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Billed Party</span>
              <span style={{ color: 'var(--text-primary)' }}>{activeBill.parties?.name || '—'}</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No active bill attached to this trip.
          </div>
        )}
      </div>

      {/* 8. Documents Section */}
      <TripDocumentsSection
        tripId={trip.id}
        initialDocuments={documents}
        userRole={userRole}
        isTripDeleted={trip.is_deleted}
      />

      {/* 9. Audit Timeline */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '1rem', fontWeight: 700 }}>
          Audit Log & Event Timeline
        </h3>

        {auditLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {auditLogs.map((log: any) => (
              <div
                key={log.id}
                style={{
                  padding: '0.85rem 1.15rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span className="badge badge-planned" style={{ marginRight: '0.75rem' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {log.profiles?.full_name || 'System User'} ({log.profiles?.role || 'SYSTEM'})
                  </span>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No audit events recorded for this trip.
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTripModal
          trip={trip}
          drivers={drivers}
          userRole={userRole}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

    </div>
  );
}
