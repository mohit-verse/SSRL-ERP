export default function HomePage() {
  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Shri Sanwariya Road Lines (SSRL) ERP
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Master Architecture v1.2 — Phase 1 System Foundation Active
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>System Status</h3>
            <span className="badge badge-settled">Phase 1 Foundation Ready</span>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Database DDL Schema, Domain Models & Integrity Invariants Configured.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Role Enums</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-transit">SUPER_ADMIN</span>
              <span className="badge badge-planned">OPERATOR</span>
              <span className="badge badge-delivered">CA_AUDITOR</span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Supabase Auth Sync & Account Deactivation Guard Active.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Financial Invariants</h3>
            <span className="badge badge-settled">ACID Locks Active</span>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              PostgreSQL Generated Columns & Check Constraints Enforced.
            </p>
          </div>
        </section>

        <footer style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Authoritative Specification: Architecture v1.2</span>
          <span>Next Authorized Phase: Phase 2 (Auth & RBAC)</span>
        </footer>
      </div>
    </div>
  );
}
