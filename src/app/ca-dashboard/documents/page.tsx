import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaDocumentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: docs } = await serviceClient
    .from('document_metadata')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Document Center (Private Drive Storage)</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Category</th>
              <th>Entity</th>
              <th>Size</th>
              <th>Status</th>
              <th>Uploaded By</th>
              <th>Upload Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(docs || []).map((doc) => (
              <tr key={doc.id} style={{ opacity: doc.status === 'DELETED' ? 0.5 : 1 }}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.file_name}</td>
                <td><span className="badge badge-planned">{doc.document_type}</span></td>
                <td>{doc.entity_type} ({doc.entity_id.slice(0, 8)}...)</td>
                <td>{(Number(doc.file_size) / 1024).toFixed(1)} KB</td>
                <td><span className={`badge ${doc.status === 'ACTIVE' ? 'badge-delivered' : 'badge-cancelled'}`}>{doc.status}</span></td>
                <td>{doc.profiles?.full_name || 'System'}</td>
                <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                <td>
                  {doc.status === 'ACTIVE' ? (
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      download
                      style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Download 📥
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Unavailable</span>
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
