'use client';

import React, { useState } from 'react';
import { Driver, UserRole } from '@/lib/types';

interface Props {
  initialDrivers: Driver[];
  userRole: UserRole;
}

export default function DriversClient({ initialDrivers, userRole }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.license_number && d.license_number.toLowerCase().includes(search.toLowerCase())) ||
    (d.phone && d.phone.includes(search))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          license_number: licenseNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create driver.');
        return;
      }

      setDrivers((prev) => [...prev, data.driver]);
      setShowModal(false);
      setName('');
      setPhone('');
      setLicenseNumber('');
    } catch {
      setErrorMsg('Network error creating driver.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by driver name, license, or phone..."
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
            + Add New Driver
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Driver Name</th>
            <th>License Number</th>
            <th>Phone</th>
            <th>Registered Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredDrivers.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No drivers registered.
              </td>
            </tr>
          ) : (
            filteredDrivers.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                <td>{d.license_number || '—'}</td>
                <td>{d.phone || '—'}</td>
                <td>{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Register New Driver</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Driver Full Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>License Number</label>
                  <input type="text" placeholder="MP09 2024001234" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>{loading ? 'Saving...' : 'Save Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
