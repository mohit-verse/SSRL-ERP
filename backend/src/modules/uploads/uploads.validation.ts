import { z } from 'zod';

export const createUploadSessionSchema = z.object({
  body: z.object({
    module: z.enum(['trip_documents', 'vehicle_documents']), // Allowed modules
    documentType: z.string().min(1).max(50),
  }),
});

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// This schema validates the metadata returned from ImageKit
// after the client successfully uploads the file.
export const uploadedFileMetadataSchema = z.object({
  imagekitFileId: z.string().min(1),
  imagekitUrl: z.string().url(),
  originalFileName: z.string().min(1).max(255),
  mimeType: z.string().refine((val) => allowedMimeTypes.includes(val), {
    message: 'Invalid file type',
  }),
  fileSize: z.number().max(MAX_FILE_SIZE_BYTES, 'File size exceeds maximum allowed limit'),
  displayOrder: z.number().int().min(1).optional(),
});
