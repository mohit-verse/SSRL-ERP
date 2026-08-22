'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';

interface Props {
  bill: any;
  userRole: UserRole;
}

export default function BillDetailClient({ bill: initialBill, userRole }: Props) {
  const [bill, setBill] = useState(initialBill);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(initialBill.current_version || 1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isReadOnly = userRole === 'CA_AUDITOR';

  const currentVersionRecord = (bill.bill_versions || []).find((v: any) => v.version_number === selectedVersionNum);
  const snapshotData = currentVersionRecord?.snapshot_data || {};
  const partyInfo = snapshotData.party || {};
  const tripSnapshots = snapshotData.trips || [];
  const totals = snapshotData.totals || {};

  const handleGenerateNewVersion = async () => {
    if (isReadOnly) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/bills/${bill.id}/versions`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to generate new bill version.');
        return;
      }

      setBill((prev: any) => ({
        ...prev,
        current_version: data.version.version_number,
        status: 'CURRENT',
        bill_versions: [...prev.bill_versions, data.version],
      }));
      setSelectedVersionNum(data.version.version_number);
      setSuccessMsg(`Successfully generated Version v${data.version.version_number}! Snapshot frozen.`);
    } catch {
      setErrorMsg('Network error generating new version.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/bills/${bill.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to cancel bill.');
        return;
      }

      setBill((prev: any) => ({ ...prev, status: 'CANCELLED', cancellation_reason: cancelReason }));
      setSuccessMsg('Bill cancelled successfully.');
      setShowCancelModal(false);
    } catch {
      setErrorMsg('Network error cancelling bill.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBill = async () => {
    if (!isSuperAdmin) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/bills/${bill.id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to restore bill.');
        return;
      }

      setBill((prev: any) => ({ ...prev, status: 'RESTORED' }));
      setSuccessMsg('Bill restored successfully.');
    } catch {
      setErrorMsg('Network error restoring bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <a href="/bills" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Bills</a>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            Bill Record: <span style={{ color: 'var(--accent-primary)' }}>{bill.bill_number}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={`badge ${bill.status === 'CURRENT' ? 'badge-delivered' : bill.status === 'OUTDATED' ? 'badge-planned' : 'badge-cancelled'}`}>
            {bill.status}
          </span>

          {!isReadOnly && bill.status === 'OUTDATED' && (
            <button onClick={handleGenerateNewVersion} disabled={loading} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {loading ? 'Generating...' : '⚡ Generate New Version (v' + (bill.current_version + 1) + ')'}
            </button>
          )}

          {isSuperAdmin && bill.status !== 'CANCELLED' && (
            <button onClick={() => setShowCancelModal(true)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancel Bill
            </button>
          )}

          {isSuperAdmin && bill.status === 'CANCELLED' && (
            <button onClick={handleRestoreBill} disabled={loading} style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Restore Bill
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Version Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.5rem' }}>Historical Versions:</span>
        {(bill.bill_versions || []).map((v: any) => (
          <button
            key={v.id}
            onClick={() => setSelectedVersionNum(v.version_number)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: selectedVersionNum === v.version_number ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: selectedVersionNum === v.version_number ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: selectedVersionNum === v.version_number ? '#000' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Version v{v.version_number} {v.version_number === bill.current_version ? '(Latest)' : ''}
          </button>
        ))}
      </div>

      {/* Frozen Snapshot Viewer */}
      <div style={{ background: '#fff', color: '#1e293b', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0 }}>SHRI SANWARIYA ROAD LINES</h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0 0 0' }}>Transportation & Logistics Service Provider</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#2563eb', margin: 0 }}>INVOICE / BILL</h3>
            <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}><strong>Bill #:</strong> {bill.bill_number}</p>
            <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}><strong>Version:</strong> v{selectedVersionNum} (FROZEN SNAPSHOT)</p>
            <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}><strong>Generated Date:</strong> {new Date(snapshotData.generated_at || bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Party Info */}
        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#0f172a', margin: '0 0 0.4rem 0' }}>Billed To (Consignor):</h4>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{partyInfo.name}</p>
          {partyInfo.gstin && <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}><strong>GSTIN:</strong> {partyInfo.gstin}</p>}
          {partyInfo.phone && <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}><strong>Phone:</strong> {partyInfo.phone}</p>}
        </div>

        {/* Trips Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem' }}>Trip #</th>
              <th style={{ padding: '0.6rem' }}>Date</th>
              <th style={{ padding: '0.6rem' }}>Vehicle</th>
              <th style={{ padding: '0.6rem' }}>Freight (₹)</th>
              <th style={{ padding: '0.6rem' }}>Unloading (₹)</th>
              <th style={{ padding: '0.6rem' }}>Detention (₹)</th>
              <th style={{ padding: '0.6rem' }}>Deductions (₹)</th>
              <th style={{ padding: '0.6rem' }}>Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {tripSnapshots.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.6rem', fontWeight: 600 }}>{t.trip_number}</td>
                <td style={{ padding: '0.6rem' }}>{t.loading_date}</td>
                <td style={{ padding: '0.6rem' }}>{t.vehicle_number || '—'}</td>
                <td style={{ padding: '0.6rem' }}>₹{t.financials.freight.toLocaleString()}</td>
                <td style={{ padding: '0.6rem' }}>₹{t.financials.unloading_charges.toLocaleString()}</td>
                <td style={{ padding: '0.6rem' }}>₹{t.financials.detention.toLocaleString()}</td>
                <td style={{ padding: '0.6rem' }}>₹{(t.financials.deductions + t.financials.tds_amount).toLocaleString()}</td>
                <td style={{ padding: '0.6rem', fontWeight: 700, color: '#0f172a' }}>₹{t.financials.net_receivable.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '280px', background: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
            <p style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem 0' }}><span>Gross Freight:</span> <strong>₹{(totals.total_freight || 0).toLocaleString()}</strong></p>
            <p style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem 0' }}><span>Unloading Charges:</span> <strong>₹{(totals.total_unloading || 0).toLocaleString()}</strong></p>
            <p style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem 0' }}><span>Detention:</span> <strong>₹{(totals.total_detention || 0).toLocaleString()}</strong></p>
            <p style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', margin: '0 0 0.4rem 0', color: '#dc2626' }}><span>Total Deductions/TDS:</span> <strong>- ₹{(totals.total_deductions || 0).toLocaleString()}</strong></p>
            <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '0.5rem 0' }} />
            <p style={{ fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', margin: 0, color: '#2563eb', fontWeight: 700 }}><span>Net Receivable:</span> <span>₹{(totals.total_net_receivable || 0).toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--status-cancelled)' }}>Cancel Bill</h2>
            <form onSubmit={handleCancelBill}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Mandatory Cancellation Reason *</label>
                <textarea required rows={3} placeholder="Incorrect party selected or bill re-issued" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCancelModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--status-cancelled)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  {loading ? 'Cancelling...' : 'Confirm Bill Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
