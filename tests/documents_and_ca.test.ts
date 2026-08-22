import { describe, it, expect } from 'vitest';
import { 
  sanitizeFilename, 
  validateDocumentFile, 
  uploadFileToDrive, 
  deleteFileFromDrive, 
  downloadFileFromDrive,
  GoogleDriveError 
} from '@/lib/integrations/googleDrive/service';
import { performDocumentReconciliation } from '@/lib/domain/documents/reconciliation';
import { performLedgerReconciliation } from '@/lib/domain/payments/reconciliation';
import { performBillingReconciliation } from '@/lib/domain/bills/reconciliation';
import { isPermissionGranted } from '@/lib/security/permissions';

describe('Phase 6 Document Storage & CA Auditor Suite', () => {

  describe('1. File Validation & Filename Sanitization', () => {
    it('sanitizes unsafe filenames and removes path traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('C:\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFilename('invoice #100 @party.pdf')).toBe('invoice__100__party.pdf');
    });

    it('accepts valid business PDF and Image files', () => {
      expect(() => validateDocumentFile('doc.pdf', 'application/pdf', 1024 * 1024)).not.toThrow();
      expect(() => validateDocumentFile('pic.jpg', 'image/jpeg', 200 * 1024)).not.toThrow();
    });

    it('rejects unsupported executable files with DOCUMENT_INVALID_TYPE', () => {
      try {
        validateDocumentFile('setup.exe', 'application/x-msdownload', 1024);
        expect.fail('Should have rejected executable');
      } catch (err: any) {
        expect(err.code).toBe('DOCUMENT_INVALID_TYPE');
      }
    });

    it('rejects oversized files exceeding 15MB with DOCUMENT_TOO_LARGE', () => {
      try {
        validateDocumentFile('large.pdf', 'application/pdf', 20 * 1024 * 1024);
        expect.fail('Should have rejected oversized file');
      } catch (err: any) {
        expect(err.code).toBe('DOCUMENT_TOO_LARGE');
      }
    });
  });

  describe('2. Drive Upload, Download & Cleanup', () => {
    it('uploads file and returns a valid file ID', async () => {
      const buffer = Buffer.from('test pdf content');
      const res = await uploadFileToDrive(buffer, 'test.pdf', 'application/pdf', 'BILL');
      expect(res.fileId).toBeDefined();
    });

    it('downloads previously stored binary file', async () => {
      const buffer = Buffer.from('binary stream data');
      const uploadRes = await uploadFileToDrive(buffer, 'invoice.pdf', 'application/pdf', 'BILL');
      const downloadRes = await downloadFileFromDrive(uploadRes.fileId);
      expect(downloadRes.buffer.toString()).toBe('binary stream data');
      expect(downloadRes.fileName).toBe('invoice.pdf');
    });

    it('deletes stored drive file cleanly', async () => {
      const buffer = Buffer.from('to be deleted');
      const uploadRes = await uploadFileToDrive(buffer, 'del.png', 'image/png', 'TRIP');
      const delSuccess = await deleteFileFromDrive(uploadRes.fileId);
      expect(delSuccess).toBe(true);
    });

    it('throws DOCUMENT_DRIVE_FILE_MISSING when downloading non-existent file', async () => {
      try {
        await downloadFileFromDrive('non-existent-drive-id');
        expect.fail('Should have thrown missing file error');
      } catch (err: any) {
        expect(err.code).toBe('DOCUMENT_DRIVE_FILE_MISSING');
      }
    });

    it('throws DOCUMENT_DRIVE_NOT_CONFIGURED in production when credentials are missing', async () => {
      const origEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = 'production';
        delete process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
        await uploadFileToDrive(Buffer.from('test'), 'test.pdf', 'application/pdf');
        expect.fail('Should have failed in production mode without credentials');
      } catch (err: any) {
        expect(err.code).toBe('DOCUMENT_DRIVE_NOT_CONFIGURED');
      } finally {
        (process.env as any).NODE_ENV = origEnv;
      }
    });
  });

  describe('3. Document Storage Reconciliation Engine', () => {
    it('detects clean document ledger without discrepancies', () => {
      const res = performDocumentReconciliation([
        {
          id: 'doc-1',
          entity_type: 'bill',
          entity_id: 'b-1',
          drive_file_id: 'drive-1',
          status: 'ACTIVE',
          entityExists: true,
          driveFileExists: true,
        },
      ]);
      expect(res.isClean).toBe(true);
      expect(res.issues.length).toBe(0);
    });

    it('detects missing drive file referenced by ACTIVE metadata', () => {
      const res = performDocumentReconciliation([
        {
          id: 'doc-1',
          entity_type: 'bill',
          entity_id: 'b-1',
          drive_file_id: 'drive-missing',
          status: 'ACTIVE',
          entityExists: true,
          driveFileExists: false,
        },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'DOCUMENT_DRIVE_FILE_MISSING')).toBe(true);
    });

    it('detects duplicate Drive File IDs across records', () => {
      const res = performDocumentReconciliation([
        { id: 'doc-1', entity_type: 'bill', entity_id: 'b-1', drive_file_id: 'dup-drive', status: 'ACTIVE' },
        { id: 'doc-2', entity_type: 'bill', entity_id: 'b-2', drive_file_id: 'dup-drive', status: 'ACTIVE' },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'DUPLICATE_DRIVE_FILE_ID')).toBe(true);
    });

    it('detects document referencing deleted / non-existent entity', () => {
      const res = performDocumentReconciliation([
        { id: 'doc-1', entity_type: 'trip', entity_id: 'orphan-trip', drive_file_id: 'd-1', status: 'ACTIVE', entityExists: false },
      ]);
      expect(res.isClean).toBe(false);
      expect(res.issues.some((i) => i.code === 'ORPHANED_ENTITY_REFERENCE')).toBe(true);
    });
  });

  describe('4. CA Auditor RBAC & Permission Enforcement Matrix', () => {
    it('grants CA_AUDITOR read permissions', () => {
      expect(isPermissionGranted('CA_AUDITOR', 'REPORTS_VIEW')).toBe(true);
      expect(isPermissionGranted('CA_AUDITOR', 'LOGISTICS_VIEW')).toBe(true);
      expect(isPermissionGranted('CA_AUDITOR', 'AUDIT_VIEW')).toBe(true);
    });

    it('strictly denies CA_AUDITOR all mutation permissions', () => {
      expect(isPermissionGranted('CA_AUDITOR', 'TRIP_CREATE')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'TRIP_EDIT_ACTIVE_FY')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'PAYMENT_RECORD')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'PAYMENT_REVERSE')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'BILL_GENERATE')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'BILL_CANCEL_RESTORE')).toBe(false);
      expect(isPermissionGranted('CA_AUDITOR', 'USER_MANAGEMENT')).toBe(false);
    });
  });

  describe('5. Cross-Module Reconciliation Regression Check', () => {
    it('payment reconciliation functions properly', () => {
      const res = performLedgerReconciliation([]);
      expect(res.isClean).toBe(true);
    });

    it('billing reconciliation functions properly', () => {
      const res = performBillingReconciliation([]);
      expect(res.isClean).toBe(true);
    });
  });
});
