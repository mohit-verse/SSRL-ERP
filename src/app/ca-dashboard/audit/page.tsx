import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaAuditLogPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: auditLogs } = await serviceClient
    .from('audit_logs')
    .select('*, profiles(full_name, role)')
    .order('performed_at', { ascending: false })
    .limit(100);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Append-Only Audit Logs</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Actor</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {(auditLogs || []).map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.performed_at).toLocaleString()}</td>
                <td><span className="badge badge-planned">{log.action}</span></td>
                <td style={{ fontWeight: 600 }}>{log.entity_type}</td>
                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.entity_id}</td>
                <td>{log.profiles?.full_name || log.performed_by} ({log.profiles?.role || 'SYSTEM'})</td>
                <td>{log.change_reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
