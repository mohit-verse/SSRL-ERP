import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/database/supabase-server';
import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { uploadDocumentTwoPhase, DocumentDomainError } from '@/lib/domain/documents/service';
import { DocumentCategory, Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const serviceClient = getServiceRoleSupabase();
    let dbQuery = serviceClient
      .from('document_metadata')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) dbQuery = dbQuery.eq('entity_type', entityType);
    if (entityId) dbQuery = dbQuery.eq('entity_id', entityId);
    if (status !== 'ALL') dbQuery = dbQuery.eq('status', status);

    const { data: documents, count, error } = await dbQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: '401 Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.is_active) return NextResponse.json({ error: '403 Forbidden' }, { status: 403 });

    if (profile.role === 'CA_AUDITOR') {
      return NextResponse.json({ error: '403 Forbidden: CA_AUDITOR accounts cannot upload documents.', code: 'DOCUMENT_ACCESS_DENIED' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entity_type') as string;
    const entityId = formData.get('entity_id') as string;
    const documentCategory = (formData.get('document_category') || 'OTHER') as DocumentCategory;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'File, entity_type, and entity_id are required.', code: 'DOCUMENT_UPLOAD_FAILED' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const metadata = await uploadDocumentTwoPhase({
      fileBuffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      entityType,
      entityId,
      documentCategory,
      userId: user.id,
      userRole: profile.role,
    });

    return NextResponse.json({ success: true, document: metadata }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof DocumentDomainError) {
      const statusCode = err.code === 'DOCUMENT_ACCESS_DENIED' ? 403 : err.code === 'DOCUMENT_ENTITY_NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status: statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
