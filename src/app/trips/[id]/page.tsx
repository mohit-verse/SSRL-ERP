import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import TripDetailClient from './TripDetailClient';

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: trip } = await serviceClient
    .from('trips')
    .select('*, parties(*), vehicles(*), vehicle_owners(*), drivers(*), trip_destinations(*), trip_party_financials(*), trip_owner_financials(*)')
    .eq('id', params.id)
    .single();

  if (!trip) notFound();

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <TripDetailClient trip={trip} userRole={profile.role} />
      </div>
    </div>
  );
}
