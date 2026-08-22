import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import SubmissionsClient from './SubmissionsClient';
import { Party } from '@/lib/types';

export default async function SubmissionsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const [partiesRes, billsRes] = await Promise.all([
    serviceClient.from('parties').select('*').order('name'),
    serviceClient.from('bills').select('id, bill_number, party_id, current_version, status').neq('status', 'CANCELLED').order('created_at', { ascending: false }),
  ]);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Customer Bill Submissions</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Submission Batching & Tracking • Proof of Delivery Submissions
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <SubmissionsClient
          parties={(partiesRes.data || []) as Party[]}
          bills={(billsRes.data || []) as any[]}
          userRole={profile.role}
        />
      </div>
    </div>
  );
}
