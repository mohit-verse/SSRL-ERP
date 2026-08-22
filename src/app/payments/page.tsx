import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import PaymentsClient from './PaymentsClient';
import { Party, VehicleOwner, Vehicle, Driver } from '@/lib/types';

export default async function PaymentsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const [partiesRes, ownersRes, tripsRes] = await Promise.all([
    serviceClient.from('parties').select('*').order('name'),
    serviceClient.from('vehicle_owners').select('*').order('name'),
    serviceClient.from('trips').select('id, trip_number, party_id, vehicle_id, loading_date').eq('is_deleted', false).neq('trip_status', 'CANCELLED').order('loading_date', { ascending: false }),
  ]);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Treasury & Payment Ledger</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Immutable Financial Ledger • Party FIFO & Owner Payment Engine
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <PaymentsClient
          parties={(partiesRes.data || []) as Party[]}
          owners={(ownersRes.data || []) as VehicleOwner[]}
          trips={(tripsRes.data || []) as any[]}
          userRole={profile.role}
        />
      </div>
    </div>
  );
}
