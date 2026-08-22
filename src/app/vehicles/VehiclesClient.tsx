'use client';

import React, { useState } from 'react';
import { Vehicle, VehicleOwner, VehicleOwnership, UserRole } from '@/lib/types';

interface Props {
  initialVehicles: Vehicle[];
  owners: VehicleOwner[];
  userRole: UserRole;
}

export default function VehiclesClient({ initialVehicles, owners, userRole }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ownershipType, setOwnershipType] = useState<VehicleOwnership>('MARKET');
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const filteredVehicles = vehicles.filter((v) =>
    v.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
    v.ownership_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          ownership_type: ownershipType,
          owner_id: ownershipType === 'MARKET' ? ownerId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create vehicle.');
        return;
      }

      setVehicles((prev) => [...prev, data.vehicle]);
      setShowModal(false);
      setVehicleNumber('');
      setOwnershipType('MARKET');
      setOwnerId('');
    } catch {
      setErrorMsg('Network error creating vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by vehicle number or ownership type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1',
            minWidth: '240px',
            padding: '0.75rem 1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        />

        {!isReadOnly && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add New Vehicle
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Vehicle Number</th>
            <th>Ownership Type</th>
            <th>Vehicle Owner</th>
            <th>Registered Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredVehicles.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No vehicles registered.
              </td>
            </tr>
          ) : (
            filteredVehicles.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{v.vehicle_number}</td>
                <td>
                  <span className={`badge ${v.ownership_type === 'OWN' ? 'badge-delivered' : 'badge-transit'}`}>
                    {v.ownership_type}
                  </span>
                </td>
                <td>{(v as any).vehicle_owners?.name || '— (SSRL Fleet)'}</td>
                <td>{new Date(v.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Register New Vehicle</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Vehicle Registration Number *</label>
                <input required type="text" placeholder="MP09AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Ownership Type *</label>
                <select value={ownershipType} onChange={(e) => setOwnershipType(e.target.value as VehicleOwnership)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="MARKET">MARKET (External Owner)</option>
                  <option value="OWN">OWN (Company Fleet)</option>
                </select>
              </div>

              {ownershipType === 'MARKET' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Vehicle Owner *</label>
                  <select required value={ownerId} onChange={(e) => setOwnerId(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                    <option value="">Select Vehicle Owner</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>{loading ? 'Saving...' : 'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
