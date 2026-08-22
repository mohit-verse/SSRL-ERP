'use client';

import React from 'react';

interface Props {
  kpis: {
    totalTrips: number;
    deliveredTrips: number;
    settledTrips: number;
    totalPartyReceivables: number;
    totalOwnerPayables: number;
    activeBills: number;
    outdatedBills: number;
    activePaymentValue: number;
    genExpenseValue: number;
    ownExpenseValue: number;
  };
  parties: any[];
  owners: any[];
}

export default function CaDashboardClient({ kpis }: Props) {
  return (
    <div>
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-glow)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0 }}>
          🔒 <strong>Audit Compliance Mode Active</strong>: All operational forms and mutation controls are strictly read-only.
        </p>
      </div>

      {/* Navigation Sub-Header */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <a href="/ca-dashboard" style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: '#000', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          KPI & Financial Overview
        </a>
        <a href="/ca-dashboard/trips" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Trip Ledger
        </a>
        <a href="/ca-dashboard/payments" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Payment Ledger
        </a>
        <a href="/ca-dashboard/bills" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Bill Registry
        </a>
        <a href="/ca-dashboard/expenses" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Expenses
        </a>
        <a href="/ca-dashboard/audit" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Audit Trail
        </a>
        <a href="/ca-dashboard/documents" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Document Center
        </a>
        <a href="/ca-dashboard/reconciliation" style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Reconciliation
        </a>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Logistics Trips</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.4rem 0' }}>{kpis.totalTrips}</p>
          <span className="badge badge-planned" style={{ fontSize: '0.75rem' }}>{kpis.deliveredTrips} Delivered • {kpis.settledTrips} Settled</span>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Party Receivables (Gross)</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-primary)', margin: '0.4rem 0' }}>
            ₹{kpis.totalPartyReceivables.toLocaleString()}
          </p>
          <span className="badge badge-delivered" style={{ fontSize: '0.75rem' }}>Authoritative Database Sum</span>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehicle Owner Payables</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b', margin: '0.4rem 0' }}>
            ₹{kpis.totalOwnerPayables.toLocaleString()}
          </p>
          <span className="badge badge-planned" style={{ fontSize: '0.75rem' }}>Authoritative Database Sum</span>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Treasury Payments</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-delivered)', margin: '0.4rem 0' }}>
            ₹{kpis.activePaymentValue.toLocaleString()}
          </p>
          <span className="badge badge-delivered" style={{ fontSize: '0.75rem' }}>Active Status Records</span>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Billing Registry</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.4rem 0' }}>{kpis.activeBills} Current</p>
          <span className="badge badge-transit" style={{ fontSize: '0.75rem' }}>{kpis.outdatedBills} Outdated Snapshots</span>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operating Expenses</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.4rem 0' }}>
            ₹{(kpis.genExpenseValue + kpis.ownExpenseValue).toLocaleString()}
          </p>
          <span className="badge badge-planned" style={{ fontSize: '0.75rem' }}>₹{kpis.genExpenseValue.toLocaleString()} Gen • ₹{kpis.ownExpenseValue.toLocaleString()} Own</span>
        </div>
      </div>
    </div>
  );
}
