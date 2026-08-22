import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaBillsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: bills } = await serviceClient
    .from('bills')
    .select('*, parties(name), bill_versions(*)')
    .order('created_at', { ascending: false });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Audit Bill Registry</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Party</th>
              <th>Current Version</th>
              <th>Status</th>
              <th>Total Versions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(bills || []).map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{b.bill_number}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.parties?.name || '—'}</td>
                <td><span className="badge badge-planned">v{b.current_version}</span></td>
                <td>
                  <span className={`badge ${b.status === 'CURRENT' ? 'badge-delivered' : b.status === 'OUTDATED' ? 'badge-planned' : 'badge-cancelled'}`}>
                    {b.status}
                  </span>
                </td>
                <td>{(b.bill_versions || []).length} Version(s)</td>
                <td>
                  <a href={`/bills/${b.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    Inspect Snapshot →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
