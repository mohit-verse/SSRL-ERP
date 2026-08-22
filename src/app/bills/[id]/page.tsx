import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import BillDetailClient from './BillDetailClient';

export default async function BillDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: bill } = await serviceClient
    .from('bills')
    .select('*, parties(*), bill_trips(*, trips(*, trip_party_financials(*))), bill_versions(*)')
    .eq('id', params.id)
    .single();

  if (!bill) notFound();

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <BillDetailClient bill={bill} userRole={profile.role} />
      </div>
    </div>
  );
}
