import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaPaymentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: payments } = await serviceClient
    .from('payments')
    .select('*, parties(name), vehicle_owners(name), payment_reversals(*)')
    .order('created_at', { ascending: false });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Audit Treasury & Payment Ledger</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Date</th>
              <th>Entity</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Reversal History</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map((p) => (
              <tr key={p.id} style={{ opacity: p.status === 'CANCELLED' ? 0.6 : 1 }}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{p.payment_number}</td>
                <td>{p.payment_date}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.parties?.name || p.vehicle_owners?.name || '—'}</td>
                <td><span className="badge badge-planned">{p.payment_type}</span></td>
                <td>{p.payment_mode}</td>
                <td style={{ fontWeight: 700 }}>₹{Number(p.amount).toLocaleString()}</td>
                <td>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'badge-delivered' : 'badge-cancelled'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.payment_reversals && p.payment_reversals.length > 0 ? (
                    <span style={{ color: 'var(--status-cancelled)', fontSize: '0.8rem', fontWeight: 600 }}>
                      Reversed (Reason: {p.payment_reversals[0].reason})
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
