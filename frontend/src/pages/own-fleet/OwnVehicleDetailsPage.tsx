import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOwnVehicleQuery } from '../../features/own-fleet/own-fleet.hooks';
import { useVehicleDocumentsQuery, useCreateUploadSessionMutation, useSaveVehicleDocumentMutation } from '../../features/vehicle-documents/vehicle-documents.hooks';
import { Button } from '../../components/form/Button';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';
import axios from 'axios';

export const OwnVehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: vehicleResponse, isLoading } = useOwnVehicleQuery(id!);
  const { data: documentsResponse, isLoading: isDocsLoading, isError: isDocsError, refetch: refetchDocs } = useVehicleDocumentsQuery(id!);
  
  const createSessionMutation = useCreateUploadSessionMutation();
  const saveDocMutation = useSaveVehicleDocumentMutation();
  
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div>Loading...</div>;
  if (!vehicleResponse?.data) return <div>Vehicle not found</div>;

  const vehicle = vehicleResponse.data;
  const documents = documentsResponse?.data || [];

  const handleDocumentUploadClick = (docType: string) => {
    setUploadingDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocType) return;

    try {
      // 1. Get session
      const sessionResponse = await createSessionMutation.mutateAsync(uploadingDocType);
      const { uploadToken, expireAt, publicKey, folder } = sessionResponse.data;

      // 2. Upload to ImageKit
      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicKey', publicKey);
      formData.append('signature', uploadToken);
      formData.append('expire', expireAt);
      formData.append('token', uploadToken);
      formData.append('folder', folder);
      formData.append('fileName', file.name);
      formData.append('useUniqueFileName', 'true');

      const ikResponse = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData);

      // 3. Save to backend
      await saveDocMutation.mutateAsync({
        vehicleId: id!,
        data: {
          document_type: uploadingDocType,
          imagekit_file_id: ikResponse.data.fileId,
          imagekit_url: ikResponse.data.url,
          file_name: ikResponse.data.name,
          mime_type: file.type,
          file_size: file.size
        }
      });

      toast.success(`${uploadingDocType} uploaded successfully`);
      refetchDocs();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const docTypes = ['RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'PUC'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Own Fleet: {vehicle.vehicle_number}
        </h1>
        <div className="flex gap-2">
          <Link to={`${ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET}/${id}/edit`}>
            <Button variant="outline">Edit Details</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.vehicle_type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Brand & Model</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.brand || '-'} / {vehicle.model || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.manufacturing_year || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Chassis No.</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.chassis_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Engine No.</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.engine_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registration Date</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Date</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Documents</h2>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/*,.pdf" 
          />

          {isDocsError ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-500">Document management is currently unavailable.</p>
              <p className="text-xs text-gray-400 mt-1">(Requires backend document APIs)</p>
            </div>
          ) : isDocsLoading ? (
            <p className="text-gray-500">Loading documents...</p>
          ) : (
            <ul className="space-y-4">
              {docTypes.map(docType => {
                const doc = documents.find(d => d.document_type === docType);
                return (
                  <li key={docType} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{docType}</p>
                      {doc && <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>}
                    </div>
                    <div>
                      {doc ? (
                        <a href={doc.imagekit_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mr-4">
                          View
                        </a>
                      ) : null}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDocumentUploadClick(docType)}
                        isLoading={uploadingDocType === docType || (createSessionMutation.isPending && uploadingDocType === docType) || (saveDocMutation.isPending && uploadingDocType === docType)}
                        disabled={uploadingDocType !== null}
                      >
                        {doc ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
