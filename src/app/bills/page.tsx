import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import BillsClient from './BillsClient';
import { Party, Trip } from '@/lib/types';

export default async function BillsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const [partiesRes, tripsRes] = await Promise.all([
    serviceClient.from('parties').select('*').order('name'),
    serviceClient.from('trips').select('id, trip_number, party_id, loading_date, loading_location, trip_party_financials(net_receivable)').eq('is_deleted', false).neq('trip_status', 'CANCELLED').order('loading_date', { ascending: false }),
  ]);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Immutable Billing Engine</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Frozen Financial Snapshots • Version Integrity & Outdated Control
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <BillsClient
          parties={(partiesRes.data || []) as Party[]}
          trips={(tripsRes.data || []) as any[]}
          userRole={profile.role}
        />
      </div>
    </div>
  );
}
