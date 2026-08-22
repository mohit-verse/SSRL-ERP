-- SSRL ERP Phase 6 Schema Enhancement Migration
-- Adds status column to document_metadata and performance indexes for CA Auditor queries

ALTER TABLE document_metadata 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE' 
CHECK (status IN ('UPLOADING', 'ACTIVE', 'FAILED', 'DELETED'));

CREATE INDEX IF NOT EXISTS idx_document_metadata_lookup ON document_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_status ON document_metadata(status);
CREATE INDEX IF NOT EXISTS idx_document_metadata_drive ON document_metadata(drive_file_id);
