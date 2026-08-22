import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { UserRole, Profile } from '@/lib/types';
import UserManagementClient from './UserManagementClient';

export default async function UserManagementPage() {
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

  if (profile.role !== 'SUPER_ADMIN') {
    redirect('/forbidden');
  }

  // Fetch users via service role client (or RLS-authorized query)
  const serviceClient = getServiceRoleSupabase();
  const { data: users } = await serviceClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>User Management & RBAC Control</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              SUPER_ADMIN Console • Account Activation & Role Management
            </p>
          </div>
          <span className="badge badge-planned">SUPER_ADMIN ONLY</span>
        </div>

        <UserManagementClient initialUsers={(users || []) as Profile[]} currentUserId={user.id} />
      </div>
    </div>
  );
}
