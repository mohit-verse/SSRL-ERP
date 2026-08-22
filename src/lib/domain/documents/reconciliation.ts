export interface DocumentReconciliationIssue {
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  documentId?: string;
  driveFileId?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  detectedAt: string;
}

export interface DocumentReconciliationResult {
  isClean: boolean;
  issues: DocumentReconciliationIssue[];
  analyzedCount: number;
}

export function performDocumentReconciliation(
  documents: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    drive_file_id: string;
    status: string;
    entityExists?: boolean;
    driveFileExists?: boolean;
  }>
): DocumentReconciliationResult {
  const issues: DocumentReconciliationIssue[] = [];
  const now = new Date().toISOString();
  const seenDriveIds = new Set<string>();

  for (const doc of documents) {
    // 1. Missing Drive File
    if (doc.status === 'ACTIVE' && doc.driveFileExists === false) {
      issues.push({
        code: 'DOCUMENT_DRIVE_FILE_MISSING',
        severity: 'CRITICAL',
        documentId: doc.id,
        driveFileId: doc.drive_file_id,
        description: `Active metadata record points to non-existent Google Drive object ${doc.drive_file_id}.`,
        detectedAt: now,
      });
    }

    // 2. Duplicate Drive File ID
    if (seenDriveIds.has(doc.drive_file_id)) {
      issues.push({
        code: 'DUPLICATE_DRIVE_FILE_ID',
        severity: 'WARNING',
        documentId: doc.id,
        driveFileId: doc.drive_file_id,
        description: `Multiple document records share the same Google Drive file ID ${doc.drive_file_id}.`,
        detectedAt: now,
      });
    } else {
      seenDriveIds.add(doc.drive_file_id);
    }

    // 3. Orphaned Entity Reference
    if (doc.entityExists === false) {
      issues.push({
        code: 'ORPHANED_ENTITY_REFERENCE',
        severity: 'WARNING',
        documentId: doc.id,
        entityType: doc.entity_type,
        entityId: doc.entity_id,
        description: `Document references non-existent ${doc.entity_type} record (${doc.entity_id}).`,
        detectedAt: now,
      });
    }

    // 4. Deleted Metadata Marked ACTIVE
    if (doc.status === 'DELETED' && doc.driveFileExists === true) {
      issues.push({
        code: 'DELETED_DOCUMENT_MARKED_ACTIVE',
        severity: 'INFO',
        documentId: doc.id,
        driveFileId: doc.drive_file_id,
        description: `Document marked DELETED in metadata but Drive object still exists.`,
        detectedAt: now,
      });
    }
  }

  return {
    isClean: issues.length === 0,
    issues,
    analyzedCount: documents.length,
  };
}
