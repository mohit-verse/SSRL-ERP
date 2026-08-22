'use client';

import React, { useState } from 'react';
import { UserRole, Driver } from '@/lib/types';

interface EditTripModalProps {
  trip: any;
  drivers: Driver[];
  userRole: UserRole;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTripModal({
  trip,
  drivers,
  userRole,
  onClose,
  onSuccess,
}: EditTripModalProps) {
  const isReadOnly = userRole === 'CA_AUDITOR' || trip.is_deleted;
  const isMarketVehicle = trip.vehicles?.ownership_type === 'MARKET';

  const partyFin = trip.trip_party_financials?.[0] || {};
  const ownerFin = trip.trip_owner_financials?.[0] || {};

  // Form State
  const [loading_date, setLoadingDate] = useState(trip.loading_date ? trip.loading_date.split('T')[0] : '');
  const [loading_location, setLoadingLocation] = useState(trip.loading_location || '');
  const [lr_number, setLrNumber] = useState(trip.lr_number || '');
  const [invoice_number, setInvoiceNumber] = useState(trip.invoice_number || '');
  const [driver_id, setDriverId] = useState(trip.driver_id || '');
  const [remarks, setRemarks] = useState(trip.remarks || '');

  // Party Financial State
  const [party_freight, setPartyFreight] = useState<number | ''>(partyFin.freight ?? '');
  const [unloading_charges, setUnloadingCharges] = useState<number | ''>(partyFin.unloading_charges ?? '');
  const [detention, setDetention] = useState<number | ''>(partyFin.detention ?? '');
  const [additional_charges, setAdditionalCharges] = useState<number | ''>(partyFin.additional_charges ?? '');
  const [deductions, setDeductions] = useState<number | ''>(partyFin.deductions ?? 0);
  const [tds_amount, setTdsAmount] = useState<number | ''>(partyFin.tds_amount ?? 0);

  // Owner Financial State
  const [owner_freight, setOwnerFreight] = useState<number | ''>(ownerFin.owner_freight ?? '');
  const [owner_detention, setOwnerDetention] = useState<number | ''>(ownerFin.detention ?? '');
  const [owner_additional_charges, setOwnerAdditionalCharges] = useState<number | ''>(ownerFin.additional_charges ?? '');
  const [owner_unloading_charges, setOwnerUnloadingCharges] = useState<number | ''>(ownerFin.unloading_charges ?? '');
  const [owner_total_deductions, setOwnerTotalDeductions] = useState<number | ''>(ownerFin.total_deductions ?? 0);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isReadOnly) {
    return null;
  }

  // Live Calculations
  const calcPartyNetReceivable = () => {
    const pf = Number(party_freight || 0);
    const uc = Number(unloading_charges || 0);
    const dt = Number(detention || 0);
    const ac = Number(additional_charges || 0);
    const dd = Number(deductions || 0);
    const tds = Number(tds_amount || 0);
    return pf + uc + dt + ac - dd - tds;
  };

  const calcOwnerNetPayable = () => {
    if (!isMarketVehicle) return 0;
    const of = Number(owner_freight || 0);
    const od = Number(owner_detention || 0);
    const oac = Number(owner_additional_charges || 0);
    const ouc = Number(owner_unloading_charges || 0);
    const odd = Number(owner_total_deductions || 0);
    return of + od + oac + ouc - odd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        loading_date,
        loading_location,
        lr_number: lr_number ? lr_number : null,
        invoice_number: invoice_number ? invoice_number : null,
        driver_id: driver_id ? driver_id : null,
        remarks: remarks ? remarks : null,

        // Party Financials
        party_freight: Number(party_freight || 0),
        unloading_charges: Number(unloading_charges || 0),
        detention: Number(detention || 0),
        additional_charges: Number(additional_charges || 0),
        deductions: Number(deductions || 0),
        tds_amount: Number(tds_amount || 0),
      };

      if (isMarketVehicle) {
        payload.owner_freight = Number(owner_freight || 0);
        payload.owner_detention = Number(owner_detention || 0);
        payload.owner_additional_charges = Number(owner_additional_charges || 0);
        payload.owner_unloading_charges = Number(owner_unloading_charges || 0);
        payload.owner_total_deductions = Number(owner_total_deductions || 0);
      }

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update trip details.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSuccess();
    } catch {
      setErrorMsg('Network connectivity error updating trip.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Edit Operational Trip: <span style={{ color: 'var(--accent-primary)' }}>{trip.trip_number}</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consignor: {trip.parties?.name} • Vehicle: {trip.vehicles?.vehicle_number} ({trip.vehicles?.ownership_type})
            </span>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--status-cancelled)',
              color: 'var(--status-cancelled)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION A: Basic Operational Metadata */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', marginBottom: '0.85rem', fontWeight: 700 }}>
              1. Basic Operational Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Loading Date *
                </label>
                <input
                  required
                  type="date"
                  disabled={isSubmitting}
                  value={loading_date}
                  onChange={(e) => setLoadingDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Loading Location Origin *
                </label>
                <input
                  required
                  type="text"
                  disabled={isSubmitting}
                  value={loading_location}
                  onChange={(e) => setLoadingLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Assigned Driver
                </label>
                <select
                  disabled={isSubmitting}
                  value={driver_id}
                  onChange={(e) => setDriverId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">-- No Driver Assigned --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  LR Number
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={lr_number}
                  onChange={(e) => setLrNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Invoice Number
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={invoice_number}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION B: Party Financials */}
          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-delivered)', fontWeight: 700 }}>
                2. Party Financials (Receivable)
              </h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--status-delivered)' }}>
                Calculated Net Receivable: ₹{calcPartyNetReceivable().toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Base Freight (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={party_freight}
                  onChange={(e) => setPartyFreight(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Unloading Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={unloading_charges}
                  onChange={(e) => setUnloadingCharges(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Detention Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={detention}
                  onChange={(e) => setDetention(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Additional Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={additional_charges}
                  onChange={(e) => setAdditionalCharges(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--status-cancelled)', marginBottom: '0.25rem' }}>Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TDS Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={tds_amount}
                  onChange={(e) => setTdsAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION C: Vehicle Owner Financials (MARKET Vehicles Only) */}
          {isMarketVehicle ? (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-planned)', fontWeight: 700 }}>
                  3. Vehicle Owner Financials (Payable)
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--status-planned)' }}>
                  Calculated Net Payable: ₹{calcOwnerNetPayable().toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Owner Freight (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    disabled={isSubmitting}
                    value={owner_freight}
                    onChange={(e) => setOwnerFreight(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Owner Detention (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isSubmitting}
                    value={owner_detention}
                    onChange={(e) => setOwnerDetention(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Additional Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isSubmitting}
                    value={owner_additional_charges}
                    onChange={(e) => setOwnerAdditionalCharges(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Unloading Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isSubmitting}
                    value={owner_unloading_charges}
                    onChange={(e) => setOwnerUnloadingCharges(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--status-cancelled)', marginBottom: '0.25rem' }}>Owner Deductions (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isSubmitting}
                    value={owner_total_deductions}
                    onChange={(e) => setOwnerTotalDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span className="badge badge-transit" style={{ fontSize: '0.8rem' }}>OWN FLEET — In-House Vehicle Operations</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Owner payables do not apply to SSRL company-owned fleet.
              </p>
            </div>
          )}

          {/* SECTION D: Remarks */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
              Operational Remarks
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter optional operational remarks or instructions..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                padding: '0.55rem 1.25rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.85rem',
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Saving Trip Changes...' : 'Save Trip Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
