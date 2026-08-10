import React, { useState } from 'react';
import { useTripDocumentsQuery, useSaveTripDocumentsMutation } from '../../../features/trips/trips.hooks';
import { useCreateUploadSessionMutation } from '../../../features/vehicle-documents/vehicle-documents.hooks';
import { Button } from '../../../components/form/Button';
import { toast } from 'sonner';
import axios from 'axios';

interface TripDocumentSectionProps {
  tripId: string;
}

export const TripDocumentSection: React.FC<TripDocumentSectionProps> = ({ tripId }) => {
  const { data: response, isLoading, isError } = useTripDocumentsQuery(tripId);
  const saveMutation = useSaveTripDocumentsMutation();
  const createSessionMutation = useCreateUploadSessionMutation();

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) return;
    setIsUploading(true);
    
    try {
      // 1. Get session for all uploads in this batch
      const sessionResponse = await createSessionMutation.mutateAsync('POD');
      const { uploadToken, expireAt, publicKey, folder } = sessionResponse.data;

      const uploadedFiles = [];

      // 2. Upload each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 10 })); // Started
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('publicKey', publicKey);
        formData.append('signature', uploadToken);
        formData.append('expire', expireAt);
        formData.append('token', uploadToken);
        formData.append('folder', folder);
        formData.append('fileName', file.name);
        formData.append('useUniqueFileName', 'true');

        const ikResponse = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
            setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
          }
        });

        uploadedFiles.push({
          imagekitFileId: ikResponse.data.fileId,
          imagekitUrl: ikResponse.data.url,
          originalFileName: file.name,
          displayOrder: i + 1
        });
      }

      // 3. Save POD metadata to Backend
      // According to API.md: POST /api/v1/trips/{tripId}/documents
      await saveMutation.mutateAsync({
        id: tripId,
        data: {
          documentType: 'POD',
          files: uploadedFiles
        }
      });

      toast.success('POD uploaded successfully');
      setFilesToUpload([]);
      setUploadProgress({});
    } catch (error: any) {
      console.error(error);
      // Fallback check as required by prompt if backend route is not found
      if (error.response?.status === 404) {
        toast.error('Backend document integration is pending. Files were uploaded to CDN but not saved to the trip.');
        setFilesToUpload([]);
      } else {
        toast.error('Failed to upload POD files');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const documents = response?.data || [];
  const podDocument = documents.find(d => d.document_type === 'POD');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proof of Delivery (POD)</h3>
      
      {isError ? (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-4 rounded-md">
          POD Document fetching is currently unavailable (Integration Pending).
        </div>
      ) : isLoading ? (
        <p className="text-sm text-gray-500">Loading documents...</p>
      ) : (
        <div className="space-y-6">
          {/* Existing POD Files */}
          {podDocument && podDocument.files && podDocument.files.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {podDocument.files.map((file) => (
                <div key={file.id} className="relative group border border-gray-200 dark:border-gray-700 rounded overflow-hidden aspect-square bg-gray-50 dark:bg-gray-800">
                  <a href={file.imagekit_url} target="_blank" rel="noopener noreferrer">
                    <img src={file.imagekit_url} alt="POD" className="object-cover w-full h-full hover:opacity-75 transition" />
                  </a>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                    {file.original_file_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No POD uploaded yet.</p>
          )}

          {/* Upload UI */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h4 className="text-sm font-medium mb-3">Upload New POD Images</h4>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="cursor-pointer bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                Select Images
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
              
              {filesToUpload.length > 0 && (
                <Button 
                  onClick={handleUpload} 
                  isLoading={isUploading}
                >
                  Upload {filesToUpload.length} Files
                </Button>
              )}
            </div>

            {filesToUpload.length > 0 && (
              <ul className="space-y-2">
                {filesToUpload.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <div className="flex items-center gap-3">
                      {uploadProgress[file.name] !== undefined && (
                        <span className="text-xs text-blue-600 font-medium">
                          {uploadProgress[file.name]}%
                        </span>
                      )}
                      <button 
                        onClick={() => removeSelectedFile(idx)} 
                        disabled={isUploading}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
