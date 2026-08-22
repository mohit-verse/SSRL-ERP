export default function ForbiddenPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--status-cancelled)', marginBottom: '0.75rem' }}>
          403 — Access Denied
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          Your authenticated user role does not have the required permissions to access this enterprise module.
        </p>
        <a href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
