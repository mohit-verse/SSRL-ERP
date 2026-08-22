'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Party, Vehicle, VehicleOwner, Driver, UserRole, TripStatus } from '@/lib/types';
import CreateTripModal from './CreateTripModal';

interface KpiSummary {
  total: number;
  planned: number;
  in_transit: number;
  delivered: number;
  settled: number;
  cancelled: number;
}

interface Props {
  parties: Party[];
  vehicles: Vehicle[];
  owners: VehicleOwner[];
  drivers: Driver[];
  userRole: UserRole;
  initialKpis: KpiSummary;
}

export default function TripsClient({ parties, vehicles, owners, drivers, userRole, initialKpis }: Props) {
  const [trips, setTrips] = useState<any[]>([]);
  const [kpis, setKpis] = useState<KpiSummary>(initialKpis);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [partyFilter, setPartyFilter] = useState<string>('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search term
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);
      if (partyFilter) params.append('party_id', partyFilter);
      if (vehicleFilter) params.append('vehicle_id', vehicleFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/trips?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      const fetchedTrips = data.trips || [];
      setTrips(fetchedTrips);
      setTotalCount(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);

      // Dynamically update KPIs if no specific filter is active
      if (!debouncedSearch && !statusFilter && !partyFilter && !vehicleFilter && !dateFrom && !dateTo) {
        setKpis({
          total: data.pagination?.total || fetchedTrips.length,
          planned: fetchedTrips.filter((t: any) => t.trip_status === 'PLANNED').length,
          in_transit: fetchedTrips.filter((t: any) => t.trip_status === 'IN_TRANSIT').length,
          delivered: fetchedTrips.filter((t: any) => t.trip_status === 'DELIVERED').length,
          settled: fetchedTrips.filter((t: any) => t.trip_status === 'SETTLED').length,
          cancelled: fetchedTrips.filter((t: any) => t.trip_status === 'CANCELLED').length,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to service. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, partyFilter, vehicleFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPartyFilter('');
    setVehicleFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleCreateSuccess = () => {
    setShowModal(false);
    setSuccessToast('Trip dispatched successfully!');
    fetchTrips();
    setTimeout(() => setSuccessToast(null), 5000);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification Banner */}
      {successToast && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid var(--status-delivered)',
            color: 'var(--status-delivered)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span>✅ {successToast}</span>
          <button onClick={() => setSuccessToast(null)} style={{ background: 'none', border: 'none', color: 'var(--status-delivered)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Trips & Logistics
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Manage trips, routes, vehicles, freight, settlements and operational status.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-transit" style={{ padding: '0.4rem 0.85rem' }}>
              ROLE: {userRole}
            </span>
            {!isReadOnly && (
              <button 
                className="btn-primary" 
                onClick={() => setShowModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <span>+</span> Create Trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Trips</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.total}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-planned)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-planned)', fontWeight: 600 }}>Planned</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.planned}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-transit)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-transit)', fontWeight: 600 }}>In Transit</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.in_transit}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-delivered)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-delivered)', fontWeight: 600 }}>Delivered</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.delivered}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-settled)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-settled)', fontWeight: 600 }}>Settled</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.settled}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-cancelled)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-cancelled)', fontWeight: 600 }}>Cancelled</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{kpis.cancelled}</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {/* Search Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Search</label>
              <input
                type="text"
                placeholder="Trip #, LR #, Invoice #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
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

            {/* Party Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Party</label>
              <select
                value={partyFilter}
                onChange={(e) => { setPartyFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
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
            </div>

            {/* Vehicle Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Vehicle</label>
              <select
                value={vehicleFilter}
                onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} ({v.ownership_type})</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Active Filter Badges & Reset Button */}
          {(search || statusFilter || partyFilter || vehicleFilter || dateFrom || dateTo) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Active Filters Applied
              </span>
              <button
                onClick={handleClearFilters}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-primary)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Trips Data Presentation (Table / Cards / States) */}
      <div className="glass-card" style={{ padding: '0.5rem 1.5rem 1.5rem 1.5rem' }}>
        
        {/* Error State */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--status-cancelled)',
            color: 'var(--status-cancelled)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            margin: '1.5rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Error Loading Operational Trips</strong>
              <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
            </div>
            <button
              onClick={fetchTrips}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--status-cancelled)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !errorMsg ? (
          <div style={{ padding: '1rem 0' }}>
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Trip #</th>
                  <th>Loading Date</th>
                  <th>Party</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Net Freight</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ height: '24px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Empty State */}
        {!loading && !errorMsg && trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.8 }}>🚛</div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Operational Trips Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              No trips match your specified search term or filter criteria. Try clearing filters or create a new trip.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {(search || statusFilter || partyFilter || vehicleFilter || dateFrom || dateTo) && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Clear Filters
                </button>
              )}
              {!isReadOnly && (
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  + Create Trip
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Data Table View */}
        {!loading && !errorMsg && trips.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Trip # / Refs</th>
                    <th>Loading Date</th>
                    <th>Party</th>
                    <th>Route</th>
                    <th>Vehicle / Driver</th>
                    <th>Net Freight</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => {
                    const partyFin = t.trip_party_financials?.[0] || t.trip_party_financials;
                    const netFreight = partyFin ? Number(partyFin.net_receivable || partyFin.freight || 0) : 0;
                    const destCount = (t.trip_destinations || []).length;

                    return (
                      <tr key={t.id} style={{ transition: 'background 0.15s ease' }}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                            {t.trip_number}
                          </div>
                          {(t.lr_number || t.invoice_number) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {t.lr_number && <span>LR: {t.lr_number}</span>}
                              {t.lr_number && t.invoice_number && <span> • </span>}
                              {t.invoice_number && <span>Inv: {t.invoice_number}</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {new Date(t.loading_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {t.parties?.name || '—'}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {t.loading_location}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {destCount > 0 ? `→ ${destCount} stop${destCount > 1 ? 's' : ''}` : '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {t.vehicles?.vehicle_number || '—'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {t.vehicles?.ownership_type === 'MARKET' ? (
                              <span style={{ color: 'var(--status-planned)' }}>MARKET</span>
                            ) : (
                              <span style={{ color: 'var(--accent-primary)' }}>OWN</span>
                            )}
                            {t.drivers?.name && ` • ${t.drivers.name}`}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {formatCurrency(netFreight)}
                        </td>
                        <td>
                          {getStatusBadge(t.trip_status)}
                        </td>
                        <td>
                          <a
                            href={`/trips/${t.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: 'var(--accent-primary)',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid var(--border-glow)',
                            }}
                          >
                            View Detail →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Pagination Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong> ({totalCount} Total Trips)
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: page <= 1 ? 'var(--bg-surface)' : 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-subtle)',
                    color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ← Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: page >= totalPages ? 'var(--bg-surface)' : 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-subtle)',
                    color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Dedicated Create Trip Modal */}
      <CreateTripModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleCreateSuccess}
        parties={parties}
        vehicles={vehicles}
        owners={owners}
        drivers={drivers}
        userRole={userRole}
      />

    </div>
  );
}
