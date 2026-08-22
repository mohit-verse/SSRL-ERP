'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Party, UserRole, BillStatus } from '@/lib/types';
import CreateBillModal from './CreateBillModal';

interface Props {
  parties: Party[];
  trips: any[];
  userRole: UserRole;
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function getBillStatusBadge(status: string) {
  switch (status) {
    case 'CURRENT':
      return <span className="badge badge-delivered" style={{ fontWeight: 700 }}>CURRENT</span>;
    case 'OUTDATED':
      return <span className="badge badge-planned" style={{ fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>OUTDATED</span>;
    case 'CANCELLED':
      return <span className="badge badge-cancelled" style={{ fontWeight: 700 }}>CANCELLED</span>;
    case 'RESTORED':
      return <span className="badge badge-settled" style={{ fontWeight: 700 }}>RESTORED</span>;
    case 'TRIP_DELETED':
      return <span className="badge badge-transit" style={{ fontWeight: 700, color: '#9ca3af', background: 'rgba(156, 163, 175, 0.15)', borderColor: 'rgba(156, 163, 175, 0.3)' }}>TRIP DELETED</span>;
    default:
      return <span className="badge badge-planned" style={{ fontWeight: 700 }}>{status || 'UNKNOWN'}</span>;
  }
}

export default function BillsClient({ parties, trips, userRole }: Props) {
  const [bills, setBills] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [customBillNumber, setCustomBillNumber] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isReadOnly = userRole === 'CA_AUDITOR';

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, partyFilter, statusFilter]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (partyFilter) params.append('party_id', partyFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/bills?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to fetch billing registry.');
        return;
      }

      setBills(data.bills || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setErrorMsg('Network error connecting to billing service.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, partyFilter, statusFilter]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Calculate KPI Status breakdown from current result set
  const currentCount = bills.filter((b) => b.status === 'CURRENT').length;
  const outdatedCount = bills.filter((b) => b.status === 'OUTDATED').length;
  const cancelledCount = bills.filter((b) => b.status === 'CANCELLED').length;
  const restoredCount = bills.filter((b) => b.status === 'RESTORED').length;
  const tripDeletedCount = bills.filter((b) => b.status === 'TRIP_DELETED').length;

  const calculateBillTotal = (bill: any) => {
    if (!bill.bill_trips || bill.bill_trips.length === 0) return 0;
    return bill.bill_trips.reduce((sum: number, bt: any) => {
      const fin = bt.trips?.trip_party_financials?.[0];
      return sum + Number(fin?.net_receivable || 0);
    }, 0);
  };

  const filteredTripsForParty = trips.filter((t) => t.party_id === selectedPartyId);

  const handleTripToggle = (id: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setModalError(null);
    if (!selectedPartyId) {
      setModalError('Please select a Party.');
      return;
    }
    if (selectedTripIds.length === 0) {
      setModalError('Please select at least one trip to bill.');
      return;
    }

    setCreating(true);
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
        setModalError(data.error || 'Failed to generate bill.');
        return;
      }

      setShowModal(false);
      setSelectedPartyId('');
      setSelectedTripIds([]);
      setCustomBillNumber('');
      fetchBills();
    } catch {
      setModalError('Network error generating bill.');
    } finally {
      setCreating(false);
    }
  };

  const isFiltered = Boolean(debouncedSearch || partyFilter || statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Bills</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{total}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--status-delivered)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-delivered)', marginTop: '0.25rem' }}>{currentCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>OUTDATED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>{outdatedCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--status-cancelled)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>CANCELLED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-cancelled)', marginTop: '0.25rem' }}>{cancelledCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--status-settled)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>RESTORED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-settled)', marginTop: '0.25rem' }}>{restoredCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #9ca3af' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>TRIP DELETED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9ca3af', marginTop: '0.25rem' }}>{tripDeletedCount}</div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Search & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.85rem', flex: '1', minWidth: '320px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by bill number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '0.65rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="CURRENT">CURRENT</option>
            <option value="OUTDATED">OUTDATED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="RESTORED">RESTORED</option>
            <option value="TRIP_DELETED">TRIP_DELETED</option>
          </select>
        </div>

        {!isReadOnly && (
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            + Create Bill
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* 3. API Error Banner */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMsg}</span>
          <button onClick={fetchBills} style={{ background: 'var(--status-cancelled)', color: '#fff', border: 'none', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {/* 4. Table view / Cards View */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading billing registry...</div>
        </div>
      ) : bills.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isFiltered ? 'No bills match the selected filters.' : 'No bills generated yet.'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isFiltered ? 'Try clearing or modifying search and filter options.' : 'Create a new bill by selecting trips for an active party.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table className="ledger-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Party</th>
                  <th>Trip Count</th>
                  <th>Current Version</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} style={{ opacity: b.status === 'CANCELLED' ? 0.65 : 1 }}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{b.bill_number}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.parties?.name || '—'}</td>
                    <td>{(b.bill_trips || []).length} Trip(s)</td>
                    <td><span className="badge badge-planned">v{b.current_version}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatIndianCurrency(calculateBillTotal(b))}</td>
                    <td>{getBillStatusBadge(b.status)}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <a href={`/bills/${b.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                        View Details →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> • <strong>{total}</strong> Total Bills
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.4rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.4rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* 6. Create Bill Modal */}
      {showModal && (
        <CreateBillModal
          parties={parties}
          trips={trips}
          userRole={userRole}
          onClose={() => setShowModal(false)}
          onSuccess={(newBill) => {
            setShowModal(false);
            fetchBills();
            if (newBill) {
              setSuccessMsg(`Bill ${newBill.bill_number} generated successfully with version v1 snapshot!`);
              setTimeout(() => setSuccessMsg(null), 5000);
            }
          }}
        />
      )}

    </div>
  );
}
