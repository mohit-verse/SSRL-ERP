import { getServiceRoleSupabase } from '@/lib/database/supabase';
import { 
  uploadFileToDrive, 
  deleteFileFromDrive, 
  validateDocumentFile,
  sanitizeFilename,
  GoogleDriveError 
} from '@/lib/integrations/googleDrive/service';
import { UserRole, DocumentCategory } from '@/lib/types';

export class DocumentDomainError extends Error {
  public code: string;
  constructor(message: string, code: string = 'DOCUMENT_ERROR') {
    super(message);
    this.name = 'DocumentDomainError';
    this.code = code;
  }
}

/**
 * Validates whether an entity (trip, bill, payment, expense, submission) exists in the database
 */
export async function validateEntityExists(entityType: string, entityId: string): Promise<boolean> {
  const serviceClient = getServiceRoleSupabase();
  let table = '';

  switch (entityType.toLowerCase()) {
    case 'trip': table = 'trips'; break;
    case 'bill': table = 'bills'; break;
    case 'payment': table = 'payments'; break;
    case 'expense': table = 'general_expenses'; break;
    case 'submission': table = 'submissions'; break;
    default: table = entityType.toLowerCase(); break;
  }

  const { data } = await serviceClient.from(table).select('id').eq('id', entityId).maybeSingle();
  return !!data;
}

/**
 * Two-Phase Document Upload Procedure:
 * Step 1: Upload binary file to Google Drive.
 * Step 2: Persist metadata record in PostgreSQL.
 * If Step 2 fails: attempt rollback of Drive upload.
 */
export async function uploadDocumentTwoPhase(input: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  entityType: string;
  entityId: string;
  documentCategory: DocumentCategory;
  userId: string;
  userRole: UserRole;
}) {
  if (input.userRole === 'CA_AUDITOR') {
    throw new DocumentDomainError('403 Forbidden: CA_AUDITOR cannot upload documents.', 'DOCUMENT_ACCESS_DENIED');
  }

  // 1. Validate entity existence
  const exists = await validateEntityExists(input.entityType, input.entityId);
  if (!exists) {
    throw new DocumentDomainError(`Entity ${input.entityType} (${input.entityId}) not found.`, 'DOCUMENT_ENTITY_NOT_FOUND');
  }

  // 2. Validate file type and size
  validateDocumentFile(input.fileName, input.mimeType, input.fileBuffer.length);
  const safeName = sanitizeFilename(input.fileName);

  // 3. STEP 1: Upload to Google Drive
  let driveFileId = '';
  try {
    const uploadRes = await uploadFileToDrive(input.fileBuffer, safeName, input.mimeType, input.documentCategory);
    driveFileId = uploadRes.fileId;
  } catch (err: any) {
    throw new DocumentDomainError(err.message || 'Drive upload failed', err.code || 'DOCUMENT_UPLOAD_FAILED');
  }

  // 4. STEP 2: Persist Metadata to PostgreSQL
  const serviceClient = getServiceRoleSupabase();
  const { data: docMetadata, error: dbErr } = await serviceClient
    .from('document_metadata')
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      document_type: input.documentCategory,
      drive_file_id: driveFileId,
      file_name: safeName,
      mime_type: input.mimeType,
      file_size: input.fileBuffer.length,
      status: 'ACTIVE',
      uploaded_by: input.userId,
    })
    .select()
    .single();

  if (dbErr || !docMetadata) {
    // Rollback Step 1: Cleanup Drive object
    try {
      await deleteFileFromDrive(driveFileId);
    } catch {
      // Record orphaned drive file for reconciliation if cleanup fails
    }
    throw new DocumentDomainError(`Database persistence failed: ${dbErr?.message}`, 'DOCUMENT_UPLOAD_FAILED');
  }

  // 5. Write Audit Log
  await serviceClient.from('audit_logs').insert({
    entity_type: 'document_metadata',
    entity_id: docMetadata.id,
    action: 'DOCUMENT_UPLOAD',
    new_values: { docMetadata },
    performed_by: input.userId,
  });

  return docMetadata;
}

/**
 * Deletes a document by marking metadata status DELETED and cleaning up Drive object
 */
export async function deleteDocument(documentId: string, userId: string, userRole: UserRole) {
  if (userRole === 'CA_AUDITOR') {
    throw new DocumentDomainError('403 Forbidden: CA_AUDITOR cannot delete documents.', 'DOCUMENT_ACCESS_DENIED');
  }

  const serviceClient = getServiceRoleSupabase();
  const { data: doc } = await serviceClient.from('document_metadata').select('*').eq('id', documentId).single();

  if (!doc) {
    throw new DocumentDomainError('Document not found.', 'DOCUMENT_NOT_FOUND');
  }

  if (doc.status === 'DELETED') {
    throw new DocumentDomainError('Document is already deleted.', 'DOCUMENT_NOT_ACTIVE');
  }

  // 1. Mark DB Metadata DELETED
  await serviceClient.from('document_metadata').update({ status: 'DELETED' }).eq('id', documentId);

  // 2. Attempt Drive cleanup
  try {
    await deleteFileFromDrive(doc.drive_file_id);
  } catch {
    // Drive deletion error logged
  }

  // 3. Log Audit
  await serviceClient.from('audit_logs').insert({
    entity_type: 'document_metadata',
    entity_id: documentId,
    action: 'DOCUMENT_DELETE',
    old_values: { status: doc.status },
    new_values: { status: 'DELETED' },
    performed_by: userId,
  });

  return true;
}
