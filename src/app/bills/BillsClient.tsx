'use client';

import React, { useState, useEffect } from 'react';
import { Party, UserRole } from '@/lib/types';

interface Props {
  parties: Party[];
  trips: any[];
  userRole: UserRole;
}

export default function BillsClient({ parties, trips, userRole }: Props) {
  const [bills, setBills] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [customBillNumber, setCustomBillNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/bills?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setBills(data.bills || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, statusFilter]);

  const filteredTripsForParty = trips.filter((t) => t.party_id === selectedPartyId);

  const handleTripToggle = (id: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setErrorMsg(null);
    if (!selectedPartyId) {
      setErrorMsg('Please select a Party.');
      return;
    }
    if (selectedTripIds.length === 0) {
      setErrorMsg('Please select at least one trip to bill.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_id: selectedPartyId,
          trip_ids: selectedTripIds,
          bill_number: customBillNumber ? customBillNumber.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to generate bill.');
        return;
      }

      setShowModal(false);
      setSelectedPartyId('');
      setSelectedTripIds([]);
      setCustomBillNumber('');
      fetchBills();
    } catch {
      setErrorMsg('Network error generating bill.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CURRENT': return <span className="badge badge-delivered">CURRENT</span>;
      case 'OUTDATED': return <span className="badge badge-planned">OUTDATED</span>;
      case 'CANCELLED': return <span className="badge badge-cancelled">CANCELLED</span>;
      case 'TRIP_DELETED': return <span className="badge badge-transit">TRIP_DELETED</span>;
      default: return <span className="badge badge-planned">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: '1', minWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search by bill number..."
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
            <option value="CURRENT">CURRENT</option>
            <option value="OUTDATED">OUTDATED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="TRIP_DELETED">TRIP_DELETED</option>
          </select>
        </div>

        {!isReadOnly && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Generate New Bill
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Party</th>
            <th>Version</th>
            <th>Mapped Trips</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading billing registry...</td></tr>
          ) : bills.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No bills generated yet.</td></tr>
          ) : (
            bills.map((b) => (
              <tr key={b.id} style={{ opacity: b.status === 'CANCELLED' ? 0.6 : 1 }}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{b.bill_number}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.parties?.name || '—'}</td>
                <td><span className="badge badge-planned">v{b.current_version}</span></td>
                <td>{(b.bill_trips || []).length} Trip(s)</td>
                <td>{getStatusBadge(b.status)}</td>
                <td>
                  <a href={`/bills/${b.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    View Snapshot →
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Generate Frozen Bill Snapshot</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBill}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Bill Number (Optional)</label>
                <input type="text" placeholder="Auto-generated if blank" value={customBillNumber} onChange={(e) => setCustomBillNumber(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Party (Consignor) *</label>
                <select required value={selectedPartyId} onChange={(e) => { setSelectedPartyId(e.target.value); setSelectedTripIds([]); }} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="">Select Party</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {selectedPartyId && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Select Trips for Bill *</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    {filteredTripsForParty.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No available trips for this Party.</p>
                    ) : (
                      filteredTripsForParty.map((t) => (
                        <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedTripIds.includes(t.id)} onChange={() => handleTripToggle(t.id)} />
                          <span style={{ fontWeight: 600 }}>{t.trip_number}</span> ({t.loading_date} - {t.loading_location}) — ₹{Number(t.trip_party_financials?.[0]?.net_receivable || 0).toLocaleString()}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                  {loading ? 'Creating Snapshot v1...' : 'Generate Bill v1'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
