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
    serviceClient
      .from('trips')
      .select('id, trip_number, party_id, loading_date, loading_location, trip_status, is_deleted, vehicles(vehicle_number), trip_destinations(destination_name, sequence_order), trip_party_financials(freight, unloading_charges, detention, additional_charges, deductions, tds_amount, gross_receivable, net_receivable), bill_trips(id, is_current)')
      .eq('is_deleted', false)
      .neq('trip_status', 'CANCELLED')
      .order('loading_date', { ascending: false }),
  ]);

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Billing & Invoicing</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Customer billing, invoice versions & financial snapshots
            </p>
          </div>
          <span className="badge badge-transit" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}>
            ROLE: {profile.role}
          </span>
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
