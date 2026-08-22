'use client';

import React, { useState } from 'react';
import { Profile, UserRole } from '@/lib/types';

interface Props {
  initialUsers: Profile[];
  currentUserId: string;
}

export default function UserManagementClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdateUser = async (targetUserId: string, newRole: UserRole, newIsActive: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (targetUserId === currentUserId) {
      setErrorMessage('Security Violation: You cannot modify your own role or activation state.');
      return;
    }

    setLoadingId(targetUserId);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: targetUserId,
          role: newRole,
          is_active: newIsActive,
          change_reason: 'SUPER_ADMIN role management update',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update user.');
        return;
      }

      setSuccessMessage('User updated successfully.');
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole, is_active: newIsActive } : u))
      );
    } catch {
      setErrorMessage('Network error while updating user state.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {successMessage}
        </div>
      )}

      <table className="ledger-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.full_name} {isSelf && '(You)'}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    disabled={isSelf || loadingId === u.id}
                    value={u.role}
                    onChange={(e) => handleUpdateUser(u.id, e.target.value as UserRole, u.is_active)}
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="CA_AUDITOR">CA_AUDITOR</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-delivered' : 'badge-cancelled'}`}>
                    {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </td>
                <td>
                  {!isSelf && (
                    <button
                      disabled={loadingId === u.id}
                      onClick={() => handleUpdateUser(u.id, u.role, !u.is_active)}
                      style={{
                        background: u.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: u.is_active ? 'var(--status-cancelled)' : 'var(--status-delivered)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
