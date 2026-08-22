import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { downloadFileFromDrive, GoogleDriveError } from '@/lib/integrations/googleDrive/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    const serviceClient = getServiceRoleSupabase();
    const { data: doc, error } = await serviceClient
      .from('document_metadata')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Document metadata record not found.', code: 'DOCUMENT_NOT_FOUND' }, { status: 404 });
    }

    if (doc.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Document is not active (status: ${doc.status}).`, code: 'DOCUMENT_NOT_ACTIVE' }, { status: 400 });
    }

    // Download binary from Google Drive via server-side service
    const { buffer, fileName, mimeType } = await downloadFileFromDrive(doc.drive_file_id);

    // Audit Event
    await serviceClient.from('audit_logs').insert({
      entity_type: 'document_metadata',
      entity_id: doc.id,
      action: 'DOCUMENT_DOWNLOAD',
      performed_by: user.id,
    });

    const isInline = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    const disposition = isInline ? `inline; filename="${fileName}"` : `attachment; filename="${fileName}"`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Disposition': disposition,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    if (err instanceof GoogleDriveError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
