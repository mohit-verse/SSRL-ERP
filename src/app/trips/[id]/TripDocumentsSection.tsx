'use client';

import React, { useState } from 'react';
import { UserRole, DocumentMetadata, DocumentCategory } from '@/lib/types';

interface TripDocumentsSectionProps {
  tripId: string;
  initialDocuments: DocumentMetadata[];
  userRole: UserRole;
  isTripDeleted: boolean;
}

export default function TripDocumentsSection({
  tripId,
  initialDocuments,
  userRole,
  isTripDeleted,
}: TripDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form Fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>('TRIP');

  const isReadOnly = userRole === 'CA_AUDITOR' || isTripDeleted;

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?entity_type=trip&entity_id=${tripId}&status=ALL`);
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
      }
    } catch {
      // Keep existing list on network failure
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 15MB maximum limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', 'trip');
      formData.append('entity_id', tripId);
      formData.append('document_category', documentCategory);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Document upload failed.');
        setIsUploading(false);
        return;
      }

      setSuccessMsg(`Document '${selectedFile.name}' uploaded successfully.`);
      setSelectedFile(null);
      setShowUploadModal(false);
      setIsUploading(false);
      fetchDocuments();
    } catch {
      setErrorMsg('Network error uploading document to storage.');
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    if (downloadingId) return;
    setErrorMsg(null);
    setDownloadingId(doc.id);

    try {
      const res = await fetch(`/api/documents/${doc.id}/download`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to download document.');
        setDownloadingId(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMsg('Network error downloading document file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete document '${fileName}'?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDeleting(docId);

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to delete document.');
        setIsDeleting(null);
        return;
      }

      setSuccessMsg(`Document '${fileName}' has been marked as DELETED.`);
      setIsDeleting(null);
      fetchDocuments();
    } catch {
      setErrorMsg('Network error deleting document.');
      setIsDeleting(null);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            Associated Trip Documents & POD Storage
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Encrypted Google Drive cloud document storage (Proof of Delivery, LR, Bills, Expenses)
          </span>
        </div>

        {!isReadOnly && (
          <button
            className="btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', fontWeight: 600 }}
          >
            + Upload Document
          </button>
        )}
      </div>

      {/* Error / Success Notifications */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--status-cancelled)', color: 'var(--status-cancelled)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--status-delivered)', color: 'var(--status-delivered)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Document List Table */}
      {documents.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Category</th>
                <th>Size</th>
                <th>Status</th>
                <th>Uploaded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isDeleted = doc.status === 'DELETED';

                return (
                  <tr key={doc.id} style={{ opacity: isDeleted ? 0.55 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: isDeleted ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.mime_type}</div>
                    </td>
                    <td>
                      <span className="badge badge-planned" style={{ fontSize: '0.75rem' }}>
                        {doc.document_type || 'TRIP'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td>
                      {doc.status === 'ACTIVE' && <span className="badge badge-delivered">ACTIVE</span>}
                      {doc.status === 'UPLOADING' && <span className="badge badge-transit">UPLOADING</span>}
                      {doc.status === 'FAILED' && <span className="badge badge-cancelled">FAILED</span>}
                      {doc.status === 'DELETED' && <span className="badge badge-cancelled" style={{ opacity: 0.7 }}>DELETED</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {doc.status === 'ACTIVE' && (
                          <button
                            disabled={downloadingId === doc.id}
                            onClick={() => handleDownload(doc)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid var(--border-glow)',
                              color: 'var(--accent-primary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {downloadingId === doc.id ? 'Downloading...' : 'Download ⬇'}
                          </button>
                        )}

                        {!isReadOnly && doc.status === 'ACTIVE' && (
                          <button
                            disabled={isDeleting === doc.id}
                            onClick={() => handleDelete(doc.id, doc.file_name)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid var(--status-cancelled)',
                              color: 'var(--status-cancelled)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              cursor: isDeleting === doc.id ? 'not-allowed' : 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {isDeleting === doc.id ? 'Deleting...' : 'Delete 🗑'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.7 }}>📁</div>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Documents Uploaded</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Upload Proof of Delivery (POD), LR copy, or weight slips associated with this trip.
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Upload Trip Document
              </h3>
              <button
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Document Category *
                </label>
                <select
                  disabled={isUploading}
                  value={documentCategory}
                  onChange={(e) => setDocumentCategory(e.target.value as DocumentCategory)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="TRIP">TRIP (POD / LR / Weight Slip)</option>
                  <option value="BILL">BILL</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="EXPENSE">EXPENSE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Select File (PDF, JPEG, PNG, XLSX, DOCX - Max 15MB) *
                </label>
                <input
                  required
                  type="file"
                  disabled={isUploading}
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="btn-primary"
                  style={{
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.85rem',
                    opacity: isUploading || !selectedFile ? 0.6 : 1,
                    cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isUploading ? 'Uploading to Drive...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
