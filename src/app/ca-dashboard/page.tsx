import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import CaDashboardClient from './CaDashboardClient';

export default async function CADashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();

  // Authoritative Database Queries for KPIs
  const [
    tripsRes,
    partiesRes,
    ownersRes,
    billsRes,
    paymentsRes,
    genExpensesRes,
    ownExpensesRes,
  ] = await Promise.all([
    serviceClient.from('trips').select('id, trip_status, is_deleted, trip_party_financials(net_receivable), trip_owner_financials(net_payable)'),
    serviceClient.from('parties').select('id, name'),
    serviceClient.from('vehicle_owners').select('id, name'),
    serviceClient.from('bills').select('id, status'),
    serviceClient.from('payments').select('id, amount, status'),
    serviceClient.from('general_expenses').select('id, amount, is_deleted').eq('is_deleted', false),
    serviceClient.from('own_vehicle_expenses').select('id, amount'),
  ]);

  const trips = tripsRes.data || [];
  const totalTrips = trips.filter((t) => !t.is_deleted).length;
  const deliveredTrips = trips.filter((t) => !t.is_deleted && t.trip_status === 'DELIVERED').length;
  const settledTrips = trips.filter((t) => !t.is_deleted && t.trip_status === 'SETTLED').length;

  const totalPartyReceivables = trips.reduce((sum, t) => sum + Number((t.trip_party_financials as any)?.[0]?.net_receivable || 0), 0);
  const totalOwnerPayables = trips.reduce((sum, t) => sum + Number((t.trip_owner_financials as any)?.[0]?.net_payable || 0), 0);

  const bills = billsRes.data || [];
  const activeBills = bills.filter((b) => b.status === 'CURRENT').length;
  const outdatedBills = bills.filter((b) => b.status === 'OUTDATED').length;

  const payments = paymentsRes.data || [];
  const activePaymentValue = payments.filter((p) => p.status === 'ACTIVE').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const genExpenseValue = (genExpensesRes.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const ownExpenseValue = (ownExpensesRes.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const kpis = {
    totalTrips,
    deliveredTrips,
    settledTrips,
    totalPartyReceivables,
    totalOwnerPayables,
    activeBills,
    outdatedBills,
    activePaymentValue,
    genExpenseValue,
    ownExpenseValue,
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>CA Auditor Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Read-Only Financial Inspection & Audit Workspace • {profile.full_name}
            </p>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <CaDashboardClient kpis={kpis} parties={partiesRes.data || []} owners={ownersRes.data || []} />
      </div>
    </div>
  );
}
