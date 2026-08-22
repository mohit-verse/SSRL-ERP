import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { deleteDocument, DocumentDomainError } from '@/lib/domain/documents/service';

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
      return NextResponse.json({ error: 'Document not found', code: 'DOCUMENT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    if (profile.role === 'CA_AUDITOR') {
      return NextResponse.json({ error: '403 Forbidden: CA_AUDITOR accounts cannot delete documents.', code: 'DOCUMENT_ACCESS_DENIED' }, { status: 403 });
    }

    await deleteDocument(params.id, user.id, profile.role);

    return NextResponse.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err: unknown) {
    if (err instanceof DocumentDomainError) {
      const status = err.code === 'DOCUMENT_ACCESS_DENIED' ? 403 : err.code === 'DOCUMENT_NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
