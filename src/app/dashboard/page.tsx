import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { requireActiveUser } from '@/lib/security/rbac';

export default async function DashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  if (profile.role === 'CA_AUDITOR') {
    redirect('/ca-dashboard');
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Operational Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Welcome back, {profile.full_name} ({profile.role})
            </p>
          </div>
          <span className="badge badge-transit">{profile.role}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Trips & Logistics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active FY Operational Entry & Trip Lifecycle</p>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Treasury & Payments</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Party Receivables & Owner Payables Engine</p>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Billing & Invoices</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Immutable Snapshots & Version Control</p>
          </div>
        </div>

        {profile.role === 'SUPER_ADMIN' && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <a href="/admin/users" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
              → Navigate to User Management (SUPER_ADMIN Only)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
