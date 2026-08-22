import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import OwnersClient from './OwnersClient';
import { VehicleOwner } from '@/lib/types';
import { sanitizeOwnerForList } from '@/lib/domain/owners/service';

export default async function VehicleOwnersPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: owners } = await serviceClient.from('vehicle_owners').select('*').order('name', { ascending: true });

  const sanitized = (owners || []).map(sanitizeOwnerForList);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Vehicle Owners Registry</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Market Fleet Vendor Directory & Payment Accounts
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <OwnersClient initialOwners={sanitized as VehicleOwner[]} userRole={profile.role} />
      </div>
    </div>
  );
}
