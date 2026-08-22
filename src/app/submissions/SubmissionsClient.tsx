'use client';

import React, { useState, useEffect } from 'react';
import { Party, UserRole } from '@/lib/types';

interface Props {
  parties: Party[];
  bills: any[];
  userRole: UserRole;
}

export default function SubmissionsClient({ parties, bills, userRole }: Props) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = userRole === 'CA_AUDITOR';

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (res.ok) setSubmissions(data.submissions || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredBillsForParty = bills.filter((b) => b.party_id === selectedPartyId);

  const handleBillToggle = (id: string) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setErrorMsg(null);
    if (!selectedPartyId) {
      setErrorMsg('Please select a Party.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_id: selectedPartyId,
          submission_date: submissionDate,
          remarks: remarks ? remarks.trim() : undefined,
          bill_ids: selectedBillIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create submission.');
        return;
      }

      setShowModal(false);
      setSelectedPartyId('');
      setSelectedBillIds([]);
      setRemarks('');
      fetchSubmissions();
    } catch {
      setErrorMsg('Network error creating submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        {!isReadOnly && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Create New Submission Batch
          </button>
        )}
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th>Submission #</th>
            <th>Party</th>
            <th>Submission Date</th>
            <th>Attached Bills</th>
            <th>Remarks</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading submissions...</td></tr>
          ) : submissions.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No submission batches created yet.</td></tr>
          ) : (
            submissions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{s.submission_number}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.parties?.name || '—'}</td>
                <td>{new Date(s.submission_date).toLocaleDateString()}</td>
                <td>
                  {(s.submission_bills || []).map((sb: any) => (
                    <span key={sb.id} className="badge badge-planned" style={{ marginRight: '0.4rem' }}>
                      {sb.bills?.bill_number}
                    </span>
                  ))}
                </td>
                <td>{s.remarks || '—'}</td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Create Customer Submission Batch</h2>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmission}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Party *</label>
                <select required value={selectedPartyId} onChange={(e) => { setSelectedPartyId(e.target.value); setSelectedBillIds([]); }} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="">Select Party</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Submission Date *</label>
                <input required type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Remarks</label>
                <input type="text" placeholder="Submitted via courier / physical hand delivery" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              {selectedPartyId && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Attach Bills to Batch</label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    {filteredBillsForParty.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active bills found for this party.</p>
                    ) : (
                      filteredBillsForParty.map((b) => (
                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedBillIds.includes(b.id)} onChange={() => handleBillToggle(b.id)} />
                          <span style={{ fontWeight: 600 }}>{b.bill_number}</span> (v{b.current_version} - {b.status})
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                  {loading ? 'Submitting Batch...' : 'Create Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
