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

  const [tripsSummaryRes, partiesRes, vehiclesRes, ownersRes, driversRes] = await Promise.all([
    serviceClient.from('trips').select('trip_status').eq('is_deleted', false),
    serviceClient.from('parties').select('*').order('name'),
    serviceClient.from('vehicles').select('*, vehicle_owners(name)').order('vehicle_number'),
    serviceClient.from('vehicle_owners').select('*').order('name'),
    serviceClient.from('drivers').select('*').order('name'),
  ]);

  const tripsSummary = tripsSummaryRes.data || [];
  const initialKpis = {
    total: tripsSummary.length,
    planned: tripsSummary.filter(t => t.trip_status === 'PLANNED').length,
    in_transit: tripsSummary.filter(t => t.trip_status === 'IN_TRANSIT').length,
    delivered: tripsSummary.filter(t => t.trip_status === 'DELIVERED').length,
    settled: tripsSummary.filter(t => t.trip_status === 'SETTLED').length,
    cancelled: tripsSummary.filter(t => t.trip_status === 'CANCELLED').length,
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <TripsClient
        parties={(partiesRes.data || []) as Party[]}
        vehicles={(vehiclesRes.data || []) as Vehicle[]}
        owners={(ownersRes.data || []) as VehicleOwner[]}
        drivers={(driversRes.data || []) as Driver[]}
        userRole={profile.role}
        initialKpis={initialKpis}
      />
    </div>
  );
}
