'use client';

import React, { useState, useEffect } from 'react';
import { Party, Vehicle, VehicleOwner, Driver, UserRole } from '@/lib/types';

interface DestinationRow {
  sequence_order: number;
  destination_name: string;
  unloading_charge: number;
  remarks: string;
}

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parties: Party[];
  vehicles: Vehicle[];
  owners: VehicleOwner[];
  drivers: Driver[];
  userRole: UserRole;
}

export default function CreateTripModal({
  isOpen,
  onClose,
  onSuccess,
  parties,
  vehicles,
  owners,
  drivers,
  userRole,
}: CreateTripModalProps) {
  // Form Fields
  const [tripNumber, setTripNumber] = useState('');
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleOwnerId, setVehicleOwnerId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [loadingLocation, setLoadingLocation] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Financial Fields
  const [partyFreight, setPartyFreight] = useState<number>(0);
  const [ownerFreight, setOwnerFreight] = useState<number>(0);

  // Multi-Destinations
  const [destinations, setDestinations] = useState<DestinationRow[]>([
    { sequence_order: 1, destination_name: '', unloading_charge: 0, remarks: '' },
  ]);

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Vehicle derived state
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const isMarketVehicle = selectedVehicle?.ownership_type === 'MARKET';

  // Automatically update owner selection when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      if (selectedVehicle.ownership_type === 'MARKET') {
        setVehicleOwnerId(selectedVehicle.owner_id || '');
      } else {
        setVehicleOwnerId('');
        setOwnerFreight(0);
      }
    }
  }, [selectedVehicle]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // CA_AUDITOR safety check
  if (userRole === 'CA_AUDITOR') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}
      >
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ color: 'var(--status-cancelled)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>403 Access Forbidden</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Users with the CA Auditor role are strictly read-only and cannot dispatch or create new operational trips.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const handleAddDestination = () => {
    setDestinations((prev) => [
      ...prev,
      { sequence_order: prev.length + 1, destination_name: '', unloading_charge: 0, remarks: '' },
    ]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length <= 1) return;
    setDestinations((prev) =>
      prev.filter((_, i) => i !== index).map((d, idx) => ({ ...d, sequence_order: idx + 1 }))
    );
  };

  const totalUnloadingCharges = destinations.reduce((sum, d) => sum + (Number(d.unloading_charge) || 0), 0);
  const previewGrossReceivable = (Number(partyFreight) || 0) + totalUnloadingCharges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // Client-side UX validations
    if (!tripNumber.trim()) {
      setErrorMsg('Trip Number is required.');
      return;
    }
    if (!loadingDate) {
      setErrorMsg('Loading Date is required.');
      return;
    }
    if (!partyId) {
      setErrorMsg('Party (Consignor) selection is required.');
      return;
    }
    if (!vehicleId) {
      setErrorMsg('Vehicle selection is required.');
      return;
    }
    if (!loadingLocation.trim()) {
      setErrorMsg('Loading Location is required.');
      return;
    }

    // Vehicle Ownership Rules Verification
    if (isMarketVehicle && !vehicleOwnerId) {
      setErrorMsg('Vehicle Owner selection is required for MARKET vehicles.');
      return;
    }
    if (!isMarketVehicle && vehicleOwnerId) {
      setErrorMsg('OWN fleet vehicles cannot have an external vehicle owner.');
      return;
    }

    // Destination validation
    for (let i = 0; i < destinations.length; i++) {
      if (!destinations[i].destination_name.trim()) {
        setErrorMsg(`Destination #${i + 1} name is required.`);
        return;
      }
      if (destinations[i].unloading_charge < 0) {
        setErrorMsg(`Destination #${i + 1} unloading charge cannot be negative.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        trip_number: tripNumber.trim(),
        party_id: partyId,
        vehicle_id: vehicleId,
        vehicle_owner_id: isMarketVehicle ? vehicleOwnerId : undefined,
        driver_id: driverId || undefined,
        loading_date: loadingDate,
        loading_location: loadingLocation.trim(),
        lr_number: lrNumber.trim() || undefined,
        invoice_number: invoiceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
        party_freight: Number(partyFreight) || 0,
        owner_freight: isMarketVehicle ? Number(ownerFreight) || 0 : 0,
        destinations,
      };

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to dispatch trip. Please verify details.');
        setIsSubmitting(false);
        return;
      }

      // Success workflow
      setIsSubmitting(false);
      onSuccess();
    } catch {
      setErrorMsg('Network connectivity error while submitting trip dispatch.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '750px',
          padding: '2rem',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.85rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Dispatch Operational Trip
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Complete basic trip details, multi-destination route, and freight rates
            </span>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '1.4rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Error Alert Banner */}
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION A — BASIC TRIP INFORMATION */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-primary)',
                marginBottom: '0.85rem',
                fontWeight: 700,
              }}
            >
              Section A — Basic Trip Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Trip Number *
                </label>
                <input
                  required
                  disabled={isSubmitting}
                  type="text"
                  placeholder="TRP-2026-001"
                  value={tripNumber}
                  onChange={(e) => setTripNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Loading Date *
                </label>
                <input
                  required
                  disabled={isSubmitting}
                  type="date"
                  value={loadingDate}
                  onChange={(e) => setLoadingDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Party (Consignor) *
                </label>
                <select
                  required
                  disabled={isSubmitting}
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">Select Consignor Party</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Driver
                </label>
                <select
                  disabled={isSubmitting}
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">Select Assigned Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.license_number ? `(${d.license_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Loading Location *
                </label>
                <input
                  required
                  disabled={isSubmitting}
                  type="text"
                  placeholder="e.g. Indore Hub Warehouse"
                  value={loadingLocation}
                  onChange={(e) => setLoadingLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  LR Number
                </label>
                <input
                  disabled={isSubmitting}
                  type="text"
                  placeholder="e.g. LR-2026-901"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Invoice Number
                </label>
                <input
                  disabled={isSubmitting}
                  type="text"
                  placeholder="e.g. INV-1002"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Operational Remarks
                </label>
                <input
                  disabled={isSubmitting}
                  type="text"
                  placeholder="Special instructions or cargo notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
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

          {/* SECTION B — VEHICLE & OWNERSHIP */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-primary)',
                marginBottom: '0.85rem',
                fontWeight: 700,
              }}
            >
              Section B — Vehicle & Ownership Configuration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Vehicle *
                </label>
                <select
                  required
                  disabled={isSubmitting}
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">Select Operational Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.ownership_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Vehicle Owner {isMarketVehicle && '*'}
                </label>
                {selectedVehicle ? (
                  isMarketVehicle ? (
                    <select
                      required
                      disabled={isSubmitting}
                      value={vehicleOwnerId}
                      onChange={(e) => setVehicleOwnerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="">Select External Vehicle Owner</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      style={{
                        padding: '0.55rem 0.85rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      OWN Fleet (SSRL In-House Vehicle)
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      padding: '0.55rem 0.85rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Select a vehicle first
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION C — DESTINATIONS */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                }}
              >
                Section C — Route Destinations
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAddDestination}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                + Add Stop
              </button>
            </div>

            {destinations.map((d, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr auto',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <input
                    required
                    disabled={isSubmitting}
                    type="text"
                    placeholder={`Destination Stop #${index + 1} Name *`}
                    value={d.destination_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestinations((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, destination_name: val } : item))
                      );
                    }}
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
                  <input
                    disabled={isSubmitting}
                    type="number"
                    min="0"
                    placeholder="Unloading Charge ₹"
                    value={d.unloading_charge}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDestinations((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, unloading_charge: val } : item))
                      );
                    }}
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

                {destinations.length > 1 && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRemoveDestination(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-cancelled)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      padding: '0 0.5rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* SECTION D — PARTY FINANCIALS */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-primary)',
                marginBottom: '0.85rem',
                fontWeight: 700,
              }}
            >
              Section D — Party Financials (Consignor Freight)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Party Base Freight Rate (₹)
                </label>
                <input
                  disabled={isSubmitting}
                  type="number"
                  min="0"
                  value={partyFreight}
                  onChange={(e) => setPartyFreight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  Preview Gross Receivable:
                </span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--status-delivered)' }}>
                  ₹ {previewGrossReceivable.toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                  (Freight ₹{partyFreight || 0} + Unloading ₹{totalUnloadingCharges})
                </span>
              </div>
            </div>
          </div>

          {/* SECTION E — OWNER FINANCIALS */}
          {isMarketVehicle && (
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <h3
                style={{
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--status-planned)',
                  marginBottom: '0.85rem',
                  fontWeight: 700,
                }}
              >
                Section E — Vehicle Owner Financials (MARKET Fleet)
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Owner Agreed Freight Rate (₹)
                </label>
                <input
                  disabled={isSubmitting}
                  type="number"
                  min="0"
                  value={ownerFreight}
                  onChange={(e) => setOwnerFreight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.85rem',
              marginTop: '1.75rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.25rem',
            }}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                padding: '0.65rem 1.35rem',
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
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Dispatching Trip...' : 'Confirm & Dispatch Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
