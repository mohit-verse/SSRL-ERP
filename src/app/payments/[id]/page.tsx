import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import PaymentDetailClient from './PaymentDetailClient';

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: payment } = await serviceClient
    .from('payments')
    .select('*, parties(*), vehicle_owners(*), trips(*), payment_allocations(*, trips(trip_number, loading_date)), party_credits(*, party_credit_usages(*)), payment_reversals(*)')
    .eq('id', params.id)
    .single();

  if (!payment) notFound();

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <PaymentDetailClient payment={payment} userRole={profile.role} />
      </div>
    </div>
  );
}
