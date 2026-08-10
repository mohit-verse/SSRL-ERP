import { apiClient } from '../../api/client';

export interface VehicleDocument {
  id: string;
  own_vehicle_id: string;
  document_type: 'RC' | 'INSURANCE' | 'FITNESS' | 'PERMIT' | 'PUC';
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  remarks?: string | null;
  imagekit_url: string;
  file_name: string;
  uploaded_at: string;
}

export const vehicleDocumentsApi = {
  // If the backend doesn't support documents API directly, these will return 404, which is expected by the prompt.
  // The prompt says "Render the UI only where the existing API contract supports it, and report missing API functionality."
  list: async (vehicleId: string) => {
    const response = await apiClient.get<{ success: boolean; data: VehicleDocument[] }>(`/own-fleet/${vehicleId}/documents`);
    return response.data;
  },
  createSession: async (documentType: string) => {
    const response = await apiClient.post<{ success: boolean; data: { uploadToken: string; expireAt: string; publicKey: string; folder: string } }>('/uploads/session', {
      module: 'vehicle_documents',
      documentType
    });
    return response.data;
  },
  save: async (vehicleId: string, data: any) => {
    const response = await apiClient.post<{ success: boolean; data: VehicleDocument }>(`/own-fleet/${vehicleId}/documents`, data);
    return response.data;
  }
};
