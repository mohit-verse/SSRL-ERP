import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import PartiesClient from './PartiesClient';
import { Party } from '@/lib/types';

export default async function PartiesPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: parties } = await serviceClient.from('parties').select('*').order('name', { ascending: true });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Parties & Consignors</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Master Customer Registry • Financial Ledger Targets
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <PartiesClient initialParties={(parties || []) as Party[]} userRole={profile.role} />
      </div>
    </div>
  );
}
