import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getExecutiveDashboardMetrics } from '@/lib/domain/dashboard/service';

export default async function DashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  if (profile.role === 'CA_AUDITOR') {
    redirect('/ca-dashboard');
  }

  let metrics = null;
  let errorState = false;

  try {
    metrics = await getExecutiveDashboardMetrics(supabase);
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    errorState = true;
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}>Executive Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Welcome back, <strong>{profile.full_name}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-transit" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              {profile.role}
            </span>
            {metrics?.timestamp && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Live as of {new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {errorState ? (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-danger, #ef4444)', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Operational Metrics Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 0 }}>
            Unable to load real-time database metrics at this time. Please refresh the page or contact system support.
          </p>
        </div>
      ) : metrics ? (
        <>
          {/* Quick Actions Bar */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '0.75rem' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="/trips" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Create Trip
              </a>
              <a href="/parties" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Add Party
              </a>
              <a href="/vehicle-owners" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Add Owner
              </a>
              <a href="/vehicles" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Add Vehicle
              </a>
              <a href="/drivers" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Add Driver
              </a>
              <a href="/payments" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Record Payment
              </a>
              <a href="/bills" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Create Bill
              </a>
            </div>
          </div>

          {/* Master Entities Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Parties</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                {metrics.masters.totalParties}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Vehicle Owners</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                {metrics.masters.totalVehicleOwners}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Vehicles</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                {metrics.masters.totalVehicles}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Drivers</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                {metrics.masters.totalDrivers}
              </div>
            </div>
          </div>

          {/* Trip Status Overview */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Trip Status Overview</h2>
              <a href="/trips" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                View All Trips →
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Trips</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.trips.totalTrips}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Planned</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>{metrics.trips.planned}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Transit</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{metrics.trips.inTransit}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Delivered</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{metrics.trips.delivered}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Settled</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1' }}>{metrics.trips.settled}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cancelled</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>{metrics.trips.cancelled}</div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Financial Overview</h2>
              <a href="/payments" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                Treasury & Payments →
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Party Receivables</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  ₹{metrics.financials.partyReceivables.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Outstanding freight from parties</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vehicle Owner Payables</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  ₹{metrics.financials.vehicleOwnerPayables.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Pending payout balance to owners</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current FY Freight Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                  ₹{metrics.financials.currentFyFreight.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Total active trip freight (Apr - Mar)</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unallocated Payments</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  ₹{metrics.financials.pendingUnsettledPayments.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Bulk payments pending allocation</div>
              </div>
            </div>
          </div>

          {/* Operational Control & Attention Required Section */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>
              Operational Control & Attention Required
            </h2>
            {metrics.controls.alerts.length === 0 ? (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.9rem' }}>
                ✓ No pending operational alerts.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {metrics.controls.alerts.map((alert, idx) => (
                  <div key={idx} style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '0.88rem' }}>
                    ⚠ {alert}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Business Module Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <a href="/trips" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', transition: 'transform 0.15s ease', cursor: 'pointer' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', marginTop: 0, marginBottom: '0.5rem' }}>
                  Trips & Logistics →
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Manage trip lifecycle, dispatching, LR details, destinations, and unloading charges.
                </p>
              </div>
            </a>

            <a href="/payments" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', transition: 'transform 0.15s ease', cursor: 'pointer' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', marginTop: 0, marginBottom: '0.5rem' }}>
                  Treasury & Payments →
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Party advance/balance collections, vehicle owner payouts, and FIFO bulk allocations.
                </p>
              </div>
            </a>

            <a href="/bills" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', transition: 'transform 0.15s ease', cursor: 'pointer' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', marginTop: 0, marginBottom: '0.5rem' }}>
                  Billing & Invoices →
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Create immutable bill snapshots, versioning history, and submission registers.
                </p>
              </div>
            </a>
          </div>

          {/* SUPER_ADMIN Only Management Link */}
          {profile.role === 'SUPER_ADMIN' && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <a href="/admin/users" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                ⚙ Navigate to User Management & Role Authorization (SUPER_ADMIN Only)
              </a>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
