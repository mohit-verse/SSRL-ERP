import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import TripsClient from './TripsClient';
import { Party, Vehicle, Driver, VehicleOwner } from '@/lib/types';

export default async function TripsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();

  const [partiesRes, vehiclesRes, ownersRes, driversRes] = await Promise.all([
    serviceClient.from('parties').select('*').order('name'),
    serviceClient.from('vehicles').select('*, vehicle_owners(name)').order('vehicle_number'),
    serviceClient.from('vehicle_owners').select('*').order('name'),
    serviceClient.from('drivers').select('*').order('name'),
  ]);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>Logistics & Trip Operations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Operational Trip Control • Multi-Destination Management & Freight Initialization
            </p>
          </div>
          <span className="badge badge-transit">ROLE: {profile.role}</span>
        </div>

        <TripsClient
          parties={(partiesRes.data || []) as Party[]}
          vehicles={(vehiclesRes.data || []) as Vehicle[]}
          owners={(ownersRes.data || []) as VehicleOwner[]}
          drivers={(driversRes.data || []) as Driver[]}
          userRole={profile.role}
        />
      </div>
    </div>
  );
}
