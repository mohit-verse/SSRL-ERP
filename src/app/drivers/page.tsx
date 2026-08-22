import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import DriversClient from './DriversClient';
import { Driver } from '@/lib/types';

export default async function DriversPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: drivers } = await serviceClient.from('drivers').select('*').order('name', { ascending: true });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Driver Directory</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Operational Drivers Registry & License Records
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <DriversClient initialDrivers={(drivers || []) as Driver[]} userRole={profile.role} />
      </div>
    </div>
  );
}
