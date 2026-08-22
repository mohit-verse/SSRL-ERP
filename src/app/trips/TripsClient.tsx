'use client';

import React, { useState, useEffect } from 'react';
import { Trip, Party, Vehicle, VehicleOwner, Driver, UserRole, TripStatus } from '@/lib/types';

interface Props {
  parties: Party[];
  vehicles: Vehicle[];
  owners: VehicleOwner[];
  drivers: Driver[];
  userRole: UserRole;
}

interface DestinationRow {
  sequence_order: number;
  destination_name: string;
  unloading_charge: number;
  remarks: string;
}

export default function TripsClient({ parties, vehicles, owners, drivers, userRole }: Props) {
  const [trips, setTrips] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [tripNumber, setTripNumber] = useState('');
  const [partyId, setPartyId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingLocation, setLoadingLocation] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [partyFreight, setPartyFreight] = useState<number>(0);
  const [ownerFreight, setOwnerFreight] = useState<number>(0);

  const [destinations, setDestinations] = useState<DestinationRow[]>([
    { sequence_order: 1, destination_name: '', unloading_charge: 0, remarks: '' },
  ]);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/trips?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTrips(data.trips || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [search, statusFilter]);

  const handleAddDestination = () => {
    setDestinations((prev) => [
      ...prev,
      { sequence_order: prev.length + 1, destination_name: '', unloading_charge: 0, remarks: '' },
    ]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length <= 1) return;
    setDestinations((prev) => prev.filter((_, i) => i !== index).map((d, idx) => ({ ...d, sequence_order: idx + 1 })));
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setErrorMsg(null);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_number: tripNumber,
          party_id: partyId,
          vehicle_id: vehicleId,
          driver_id: driverId || undefined,
          loading_date: loadingDate,
          loading_location: loadingLocation,
          lr_number: lrNumber || undefined,
          invoice_number: invoiceNumber || undefined,
          remarks: remarks || undefined,
          party_freight: Number(partyFreight),
          owner_freight: Number(ownerFreight),
          destinations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create trip.');
        return;
      }

      setShowModal(false);
      fetchTrips();
    } catch {
      setErrorMsg('Network error creating trip.');
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'IN_TRANSIT': return <span className="badge badge-transit">IN TRANSIT</span>;
      case 'DELIVERED': return <span className="badge badge-delivered">DELIVERED</span>;
      case 'SETTLED': return <span className="badge badge-settled">SETTLED</span>;
      case 'CANCELLED': return <span className="badge badge-cancelled">CANCELLED</span>;
      default: return <span className="badge badge-planned">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: '1', minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search trip #, LR #, Invoice #..."
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
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">PLANNED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SETTLED">SETTLED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {!isReadOnly && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Dispatch New Trip
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Trip #</th>
            <th>Loading Date</th>
            <th>Party</th>
            <th>Vehicle</th>
            <th>Loading Location</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading trips...</td></tr>
          ) : trips.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No trips registered.</td></tr>
          ) : (
            trips.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{t.trip_number}</td>
                <td>{new Date(t.loading_date).toLocaleDateString()}</td>
                <td>{t.parties?.name || '—'}</td>
                <td>{t.vehicles?.vehicle_number} ({t.vehicles?.ownership_type})</td>
                <td>{t.loading_location}</td>
                <td>{getStatusBadge(t.trip_status)}</td>
                <td>
                  <a href={`/trips/${t.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    View Detail →
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '680px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Dispatch New Operational Trip</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTrip}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Trip Number *</label>
                  <input required type="text" placeholder="TRP-2026-001" value={tripNumber} onChange={(e) => setTripNumber(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Loading Date *</label>
                  <input required type="date" value={loadingDate} onChange={(e) => setLoadingDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Party (Consignor) *</label>
                  <select required value={partyId} onChange={(e) => setPartyId(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                    <option value="">Select Party</option>
                    {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Vehicle *</label>
                  <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.ownership_type})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Driver</label>
                  <select value={driverId} onChange={(e) => setDriverId(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                    <option value="">Select Driver</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Loading Location *</label>
                  <input required type="text" placeholder="Indore Warehouse" value={loadingLocation} onChange={(e) => setLoadingLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Party Freight Rate (₹)</label>
                  <input type="number" min="0" value={partyFreight} onChange={(e) => setPartyFreight(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Owner Freight Rate (₹)</label>
                  <input type="number" min="0" value={ownerFreight} onChange={(e) => setOwnerFreight(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              {/* Multi-Destinations Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)' }}>Multi-Destination Route Unloading</h3>
                  <button type="button" onClick={handleAddDestination} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--border-glow)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>+ Add Stop</button>
                </div>

                {destinations.map((d, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input required type="text" placeholder={`Destination #${index + 1} Name`} value={d.destination_name} onChange={(e) => {
                      const val = e.target.value;
                      setDestinations((prev) => prev.map((item, i) => i === index ? { ...item, destination_name: val } : item));
                    }} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />

                    <input type="number" min="0" placeholder="Unloading ₹" value={d.unloading_charge} onChange={(e) => {
                      const val = Number(e.target.value);
                      setDestinations((prev) => prev.map((item, i) => i === index ? { ...item, unloading_charge: val } : item));
                    }} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />

                    {destinations.length > 1 && (
                      <button type="button" onClick={() => handleRemoveDestination(index)} style={{ background: 'none', border: 'none', color: 'var(--status-cancelled)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Confirm & Dispatch Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
