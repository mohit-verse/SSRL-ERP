import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';

export default async function CaExpensesPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) redirect('/login');

  const serviceClient = getServiceRoleSupabase();
  const [genRes, ownRes] = await Promise.all([
    serviceClient.from('general_expenses').select('*, profiles(full_name)').order('expense_date', { ascending: false }),
    serviceClient.from('own_vehicle_expenses').select('*, vehicles(vehicle_number), drivers(name), profiles(full_name)').order('expense_date', { ascending: false }),
  ]);

  const genExpenses = genRes.data || [];
  const ownExpenses = ownRes.data || [];

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <a href="/ca-dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← CA Dashboard</a>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: '0.4rem' }}>CA Audit Expenses Ledger</h1>
          </div>
          <span className="badge badge-delivered">CA_AUDITOR (Read-Only)</span>
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>General Expenses</h3>
        <table className="ledger-table" style={{ marginBottom: '2.5rem' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount (₹)</th>
              <th>Remark</th>
              <th>Status</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {genExpenses.map((e) => (
              <tr key={e.id} style={{ opacity: e.is_deleted ? 0.5 : 1 }}>
                <td>{e.expense_date}</td>
                <td style={{ fontWeight: 600 }}>{e.category}</td>
                <td style={{ fontWeight: 700 }}>₹{Number(e.amount).toLocaleString()}</td>
                <td>{e.reason_or_remark || '—'}</td>
                <td><span className={`badge ${e.is_deleted ? 'badge-cancelled' : 'badge-delivered'}`}>{e.is_deleted ? 'DELETED' : 'ACTIVE'}</span></td>
                <td>{e.profiles?.full_name || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Own Vehicle Expenses</h3>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Category</th>
              <th>Amount (₹)</th>
              <th>Remark</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {ownExpenses.map((e) => (
              <tr key={e.id}>
                <td>{e.expense_date}</td>
                <td style={{ fontWeight: 600 }}>{e.vehicles?.vehicle_number || '—'}</td>
                <td>{e.drivers?.name || '—'}</td>
                <td><span className="badge badge-planned">{e.expense_type}</span></td>
                <td style={{ fontWeight: 700 }}>₹{Number(e.amount).toLocaleString()}</td>
                <td>{e.reason_or_remark}</td>
                <td>{e.profiles?.full_name || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
