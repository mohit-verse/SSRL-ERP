'use client';

import React, { useState, useMemo } from 'react';
import { Party, UserRole } from '@/lib/types';
import { formatIndianCurrency } from './BillsClient';

interface Props {
  parties: Party[];
  trips: any[];
  userRole: UserRole;
  onClose: () => void;
  onSuccess: (newBill?: any) => void;
}

export function isTripEligibleForBilling(trip: any, selectedPartyId: string): boolean {
  if (!trip || !selectedPartyId) return false;
  if (trip.party_id !== selectedPartyId) return false;
  if (trip.is_deleted) return false;
  if (trip.trip_status === 'CANCELLED') return false;

  // Check if trip is attached to an active CURRENT bill
  const isAlreadyBilled = Array.isArray(trip.bill_trips) &&
    trip.bill_trips.some((bt: any) => bt.is_current === true);

  if (isAlreadyBilled) return false;

  return true;
}

export function calculateFinancialTotals(selectedTrips: any[]) {
  let gross = 0;
  let deductions = 0;
  let tds = 0;

  for (const t of selectedTrips) {
    const fin = Array.isArray(t.trip_party_financials) ? t.trip_party_financials[0] : t.trip_party_financials;
    if (!fin) continue;

    const freight = Number(fin.freight || 0);
    const unloading = Number(fin.unloading_charges || 0);
    const detention = Number(fin.detention || 0);
    const additional = Number(fin.additional_charges || 0);
    const ded = Number(fin.deductions || 0);
    const tdsAmt = Number(fin.tds_amount || 0);

    const tripGross = freight + unloading + detention + additional;

    gross += tripGross;
    deductions += ded;
    tds += tdsAmt;
  }

  const net = gross - deductions - tds;

  return { gross, deductions, tds, net };
}

export default function CreateBillModal({
  parties,
  trips,
  userRole,
  onClose,
  onSuccess,
}: Props) {
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [customBillNumber, setCustomBillNumber] = useState('');
  const [tripSearch, setTripSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isReadOnly = userRole === 'CA_AUDITOR';

  // Filter eligible trips for the selected party
  const eligibleTrips = useMemo(() => {
    if (!selectedPartyId) return [];
    return trips.filter((t) => isTripEligibleForBilling(t, selectedPartyId));
  }, [trips, selectedPartyId]);

  // Filter visible trips by search query inside modal
  const visibleTrips = useMemo(() => {
    if (!tripSearch.trim()) return eligibleTrips;
    const query = tripSearch.toLowerCase().trim();
    return eligibleTrips.filter((t) => {
      const numMatch = t.trip_number?.toLowerCase().includes(query);
      const locMatch = t.loading_location?.toLowerCase().includes(query);
      const vehMatch = t.vehicles?.vehicle_number?.toLowerCase().includes(query);
      return numMatch || locMatch || vehMatch;
    });
  }, [eligibleTrips, tripSearch]);

  const selectedTripsObjects = useMemo(() => {
    return trips.filter((t) => selectedTripIds.includes(t.id));
  }, [trips, selectedTripIds]);

  const financials = useMemo(() => {
    return calculateFinancialTotals(selectedTripsObjects);
  }, [selectedTripsObjects]);

  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPartyId(e.target.value);
    setSelectedTripIds([]);
    setTripSearch('');
    setErrorMsg(null);
  };

  const handleTripToggle = (tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = visibleTrips.map((t) => t.id);
    setSelectedTripIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearSelection = () => {
    setSelectedTripIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setErrorMsg('403 Forbidden: CA_AUDITOR is strictly read-only.');
      return;
    }

    setErrorMsg(null);

    if (!selectedPartyId) {
      setErrorMsg('Please select a Billing Party.');
      return;
    }

    if (selectedTripIds.length === 0) {
      setErrorMsg('At least one eligible trip must be selected for bill generation.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        party_id: selectedPartyId,
        trip_ids: selectedTripIds,
      };

      if (customBillNumber.trim()) {
        payload.bill_number = customBillNumber.trim();
      }

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 409 || data.code === 'BILL_TRIP_ALREADY_BILLED') {
          setErrorMsg(data.error || 'Conflict: One or more selected trips are already attached to an active bill.');
        } else if (res.status === 403) {
          setErrorMsg('403 Forbidden: You do not have permission to generate bills.');
        } else {
          setErrorMsg(data.error || 'Failed to generate bill.');
        }
        return;
      }

      onSuccess(data.bill);
    } catch {
      setErrorMsg('Network connectivity error creating bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Generate Customer Bill</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Select party & eligible operational trips to issue an immutable frozen bill snapshot (v1).
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Server Error Alert Banner */}
        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* STEP 1: Select Billing Party */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              1. Select Billing Party (Consignor) *
            </label>
            <select
              required
              value={selectedPartyId}
              onChange={handlePartyChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* STEP 2: Optional Custom Bill Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              2. Custom Bill Number (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank for auto-generated bill number"
              value={customBillNumber}
              onChange={(e) => setCustomBillNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* STEP 3: Eligible Trips Selection Workspace */}
          {selectedPartyId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  3. Select Eligible Trips ({eligibleTrips.length} Available)
                </label>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    disabled={visibleTrips.length === 0}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid var(--accent-primary)',
                      color: 'var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Select All Visible
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    disabled={selectedTripIds.length === 0}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Trip Search Filter inside modal */}
              <input
                type="text"
                placeholder="Filter trips by trip number, location or vehicle..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                style={{
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />

              {/* Trips List Container */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {visibleTrips.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No eligible unbilled trips found for this party.
                  </div>
                ) : (
                  visibleTrips.map((t) => {
                    const isChecked = selectedTripIds.includes(t.id);
                    const fin = Array.isArray(t.trip_party_financials) ? t.trip_party_financials[0] : t.trip_party_financials;
                    const netRec = Number(fin?.net_receivable || 0);

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTripToggle(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div click
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                              {t.trip_number}
                              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                                ({new Date(t.loading_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {t.loading_location})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              Vehicle: {t.vehicles?.vehicle_number || '—'}
                              {t.trip_destinations?.[0]?.destination_name && ` → ${t.trip_destinations[0].destination_name}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                          {formatIndianCurrency(netRec)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              👈 Select a party above to view eligible trips.
            </div>
          )}

          {/* STEP 4: Live Bill Financial Preview Card */}
          {selectedTripIds.length > 0 && (
            <div className="glass-card" style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Live Bill Financial Summary ({selectedTripIds.length} Trips Selected)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Gross Receivable</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatIndianCurrency(financials.gross)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Deductions</span>
                  <strong style={{ color: 'var(--status-cancelled)' }}>-{formatIndianCurrency(financials.deductions)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>TDS Amount</span>
                  <strong style={{ color: '#f59e0b' }}>-{formatIndianCurrency(financials.tds)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Total Bill Amount (Net)</span>
                  <strong style={{ color: 'var(--status-delivered)', fontSize: '1rem' }}>{formatIndianCurrency(financials.net)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isReadOnly || selectedTripIds.length === 0}
              className="btn-primary"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                opacity: (submitting || isReadOnly || selectedTripIds.length === 0) ? 0.6 : 1,
                cursor: (submitting || isReadOnly || selectedTripIds.length === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Generating Frozen Snapshot v1...' : `Generate Bill (${selectedTripIds.length} Trips)`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
