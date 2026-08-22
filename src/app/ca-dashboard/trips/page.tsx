import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaTripsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const { data: trips } = await serviceClient
    .from('trips')
    .select('*, parties(name), vehicles(vehicle_number), trip_party_financials(net_receivable), trip_owner_financials(net_payable)')
    .order('loading_date', { ascending: false });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Audit Trip Ledger</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Trip #</th>
              <th>Loading Date</th>
              <th>Party</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Net Receivable (₹)</th>
              <th>Owner Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(trips || []).map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{t.trip_number}</td>
                <td>{t.loading_date}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.parties?.name || '—'}</td>
                <td>{t.vehicles?.vehicle_number || '—'}</td>
                <td><span className="badge badge-planned">{t.trip_status}</span></td>
                <td style={{ fontWeight: 600 }}>₹{Number(t.trip_party_financials?.[0]?.net_receivable || 0).toLocaleString()}</td>
                <td style={{ fontWeight: 600 }}>₹{Number(t.trip_owner_financials?.[0]?.net_payable || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
