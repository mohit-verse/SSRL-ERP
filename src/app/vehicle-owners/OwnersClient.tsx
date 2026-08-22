'use client';

import React, { useState } from 'react';
import { VehicleOwner, UserRole } from '@/lib/types';

interface Props {
  initialOwners: VehicleOwner[];
  userRole: UserRole;
}

export default function OwnersClient({ initialOwners, userRole }: Props) {
  const [owners, setOwners] = useState<VehicleOwner[]>(initialOwners);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const filteredOwners = owners.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.pan_number && o.pan_number.toLowerCase().includes(search.toLowerCase())) ||
    (o.phone && o.phone.includes(search))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/vehicle-owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          pan_number: panNumber,
          bank_details: { account_number: accountNumber, ifsc_code: ifsc },
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create owner.');
        return;
      }

      setOwners((prev) => [...prev, data.owner]);
      setShowModal(false);
      setName('');
      setPhone('');
      setPanNumber('');
      setAccountNumber('');
      setIfsc('');
      setAddress('');
    } catch {
      setErrorMsg('Network error creating vehicle owner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search owner by name, PAN, or phone..."
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
            + Add Vehicle Owner
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Owner Name</th>
            <th>PAN Number</th>
            <th>Phone</th>
            <th>Bank Account</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {filteredOwners.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No vehicle owners registered.
              </td>
            </tr>
          ) : (
            filteredOwners.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.name}</td>
                <td>{o.pan_number || '—'}</td>
                <td>{o.phone || '—'}</td>
                <td>{String((o.bank_details as any)?.account_number || '—')}</td>
                <td>{o.address || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Register Vehicle Owner</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Owner Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>PAN Number</label>
                  <input type="text" placeholder="ABCDE1234F" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Bank Account Number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>IFSC Code</label>
                  <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Address</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>{loading ? 'Saving...' : 'Save Owner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
