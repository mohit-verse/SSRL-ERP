import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { requirePermission, preventSelfRoleEscalation, AuthorizationError, AuthenticationError } from '@/lib/security/rbac';
import { Profile } from '@/lib/types';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '401 Unauthorized: Authentication required' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: '403 Forbidden: Account is deactivated or profile invalid' }, { status: 403 });
    }

    // Require USER_MANAGEMENT permission (SUPER_ADMIN only)
    requirePermission(profile as Profile, 'USER_MANAGEMENT');

    const body = await request.json();
    const { target_user_id, role, is_active, change_reason } = body;

    if (!target_user_id || !role || is_active === undefined) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    // Prevent Self-Escalation / Self-Deactivation
    preventSelfRoleEscalation(user.id, target_user_id);

    const serviceClient = getServiceRoleSupabase();

    // Fetch OLD user record for Audit Log
    const { data: oldTargetProfile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', target_user_id)
      .single();

    if (!oldTargetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Update target profile
    const { data: updatedProfile, error: updateError } = await serviceClient
      .from('profiles')
      .update({
        role,
        is_active,
      })
      .eq('id', target_user_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    // Audit Event Integration Point (OLD -> NEW)
    await serviceClient.from('audit_logs').insert({
      entity_type: 'profile',
      entity_id: target_user_id,
      action: 'PROFILE_ROLE_STATUS_UPDATE',
      old_values: { role: oldTargetProfile.role, is_active: oldTargetProfile.is_active },
      new_values: { role: updatedProfile.role, is_active: updatedProfile.is_active },
      change_reason: change_reason || 'SUPER_ADMIN role management',
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
