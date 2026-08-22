'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/lib/types';
import { formatIndianCurrency, getBillStatusBadge } from '../BillsClient';

interface Props {
  billId: string;
  userRole: UserRole;
}

export default function BillDetailClient({ billId, userRole }: Props) {
  const [bill, setBill] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

  const fetchBillDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bills/${billId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setErrorMsg('404: Bill record not found.');
        } else {
          setErrorMsg(data.error || 'Failed to load bill details.');
        }
        return;
      }

      setBill(data.bill);
      setAuditLogs(data.auditLogs || []);
      // Set default selected version to current_version
      setSelectedVersionNumber(data.bill.current_version || 1);
    } catch {
      setErrorMsg('Network error connecting to billing service.');
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBillDetails();
  }, [fetchBillDetails]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading bill snapshot & version history...</div>
      </div>
    );
  }

  if (errorMsg || !bill) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--status-cancelled)', marginBottom: '0.75rem' }}>
          {errorMsg || 'Bill Not Found'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          The requested billing record could not be loaded or may have been deleted.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="/bills" style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            ← Back to Bills
          </a>
          <button onClick={fetchBillDetails} className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Sorted versions descending
  const versions = [...(bill.bill_versions || [])].sort((a, b) => b.version_number - a.version_number);

  // Active selected version
  const activeVersion = versions.find((v) => v.version_number === selectedVersionNumber) || versions[0];
  const isCurrentVersionSelected = activeVersion?.version_number === bill.current_version;

  // Snapshot Data (STRICT IMMUTABLE HISTORICAL RECORD)
  const snapshot = activeVersion?.snapshot_data || {};
  const partyInfo = snapshot.party || bill.parties || {};
  const snapshotTrips = snapshot.trips || [];
  const snapshotTotals = snapshot.totals || {};

  // Financial values strictly from snapshot
  const totalGross = Number(snapshotTotals.total_gross_receivable || 0);
  const totalDeductions = Number(snapshotTotals.total_deductions || 0);
  const totalTds = Number(snapshotTotals.total_tds_amount || 0);
  const totalNet = Number(snapshotTotals.total_net_receivable || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Top Navigation & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <a href="/bills" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            ← Back to Bills Workspace
          </a>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            Bill {bill.bill_number}
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Party: <strong>{partyInfo.name || '—'}</strong> • Issued: {new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {getBillStatusBadge(bill.status)}
          <span className="badge badge-planned" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.4rem 0.85rem' }}>
            v{bill.current_version} Active
          </span>
        </div>
      </div>

      {/* 2. Status Banners */}
      {bill.status === 'OUTDATED' && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ THIS BILL IS OUTDATED</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Underlying trip financial information changed after this bill version snapshot was generated. Regenerate a new version (v{(bill.current_version || 1) + 1}) from the bills workspace to update snapshot data.
          </p>
        </div>
      )}

      {bill.status === 'TRIP_DELETED' && (
        <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', color: '#f97316', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ TRIP DELETED — BILL INCOMPLETE</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            One or more trips associated with this bill were soft-deleted. Historical snapshot data remains preserved for financial integrity and audit tracking.
          </p>
        </div>
      )}

      {bill.status === 'CANCELLED' && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>🚫 BILL CANCELLED</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Reason: <strong>{bill.cancellation_reason || 'No reason provided.'}</strong>
            {bill.cancelled_at && ` • Cancelled on ${new Date(bill.cancelled_at).toLocaleString('en-IN')}`}
          </p>
        </div>
      )}

      {bill.status === 'RESTORED' && (
        <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid var(--status-settled)', color: 'var(--status-settled)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>ℹ️ BILL RESTORED</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            This bill was restored from cancelled status by an authorized Super Admin.
          </p>
        </div>
      )}

      {/* 3. Version Selector Header Indicator */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: isCurrentVersionSelected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(59, 130, 246, 0.08)', borderLeft: `4px solid ${isCurrentVersionSelected ? 'var(--status-delivered)' : 'var(--accent-primary)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isCurrentVersionSelected ? 'var(--status-delivered)' : 'var(--accent-primary)' }}>
            {isCurrentVersionSelected ? '🟢 CURRENT VERSION' : '🔷 HISTORICAL SNAPSHOT VERSION'} (v{activeVersion?.version_number})
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Generated on {activeVersion?.generated_at ? new Date(activeVersion.generated_at).toLocaleString('en-IN') : '—'}
          </span>
        </div>

        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatIndianCurrency(totalNet)}
        </div>
      </div>

      {/* Main Details Grid: Left Content (Trips & Summary) + Right Sidebar (Version History) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Financial Snapshot Breakdown & Trip Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Executive Financial Summary Grid */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Snapshot Financial Summary (v{activeVersion?.version_number})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Trips Count</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {snapshotTotals.trip_count || snapshotTrips.length || 0}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gross Receivable</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {formatIndianCurrency(totalGross)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deductions</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-cancelled)', marginTop: '0.2rem' }}>
                  -{formatIndianCurrency(totalDeductions)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TDS Amount</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>
                  -{formatIndianCurrency(totalTds)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Net Receivable</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-delivered)', marginTop: '0.2rem' }}>
                  {formatIndianCurrency(totalNet)}
                </div>
              </div>
            </div>
          </div>

          {/* Snapshot Trips Ledger Table */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Snapshot Trip Membership ({snapshotTrips.length} Trips)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Trip #</th>
                    <th>Loading Date</th>
                    <th>Location / Route</th>
                    <th>Vehicle</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshotTrips.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No trip snapshots found in version v{activeVersion?.version_number}.</td></tr>
                  ) : (
                    snapshotTrips.map((t: any) => {
                      const fin = t.financials || {};
                      const destStr = t.destinations?.map((d: any) => d.destination_name).join(' → ') || '—';

                      return (
                        <tr key={t.id || t.trip_number}>
                          <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{t.trip_number}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {t.loading_date ? new Date(t.loading_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{t.loading_location || '—'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{destStr}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.vehicle_number || '—'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatIndianCurrency(Number(fin.gross_receivable || 0))}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--status-cancelled)' }}>-{formatIndianCurrency(Number(fin.deductions || 0))}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{formatIndianCurrency(Number(fin.net_receivable || 0))}</td>
                          <td>
                            <a href={`/trips/${t.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                              View Trip →
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Timeline */}
          {auditLogs.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Billing Audit History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span className="badge badge-planned" style={{ fontSize: '0.75rem', fontWeight: 700, marginRight: '0.5rem' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        by <strong>{log.profiles?.full_name || 'System User'}</strong> ({log.profiles?.role || 'OPERATOR'})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Immutable Version History Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Version History ({versions.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Select a version to inspect its immutable financial snapshot.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {versions.map((ver) => {
                const isSelected = ver.version_number === selectedVersionNumber;
                const isCurrent = ver.version_number === bill.current_version;
                const verTotals = ver.snapshot_data?.totals || {};

                return (
                  <div
                    key={ver.id || ver.version_number}
                    onClick={() => setSelectedVersionNumber(ver.version_number)}
                    style={{
                      padding: '0.85rem 1rem',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        Version {ver.version_number}
                      </span>
                      {isCurrent ? (
                        <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>CURRENT</span>
                      ) : (
                        <span className="badge badge-transit" style={{ fontSize: '0.7rem' }}>HISTORICAL</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>{ver.generated_at ? new Date(ver.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {formatIndianCurrency(Number(verTotals.total_net_receivable || 0))}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
