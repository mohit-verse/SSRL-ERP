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

  const [tripRes, allocationsRes, billingRes, docsRes, auditRes, driversRes] = await Promise.all([
    serviceClient
      .from('trips')
      .select('*, parties(*), vehicles(*), vehicle_owners(*), drivers(*), trip_destinations(*), trip_party_financials(*), trip_owner_financials(*)')
      .eq('id', params.id)
      .single(),

    serviceClient
      .from('payment_allocations')
      .select('*, payments(*, parties(name), vehicle_owners(name))')
      .eq('trip_id', params.id)
      .eq('status', 'ACTIVE'),

    serviceClient
      .from('bill_trips')
      .select('*, bills(*, parties(name))')
      .eq('trip_id', params.id)
      .eq('is_current', true)
      .maybeSingle(),

    serviceClient
      .from('document_metadata')
      .select('*')
      .eq('entity_type', 'trip')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false }),

    serviceClient
      .from('audit_logs')
      .select('*, profiles(full_name, role)')
      .eq('entity_type', 'trip')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false }),

    serviceClient
      .from('drivers')
      .select('*')
      .order('name', { ascending: true }),
  ]);

  if (!tripRes.data) notFound();

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <TripDetailClient
        trip={tripRes.data}
        allocations={allocationsRes.data || []}
        activeBill={billingRes.data?.bills || null}
        documents={docsRes.data || []}
        auditLogs={auditRes.data || []}
        drivers={driversRes.data || []}
        userRole={profile.role}
      />
    </div>
  );
}
