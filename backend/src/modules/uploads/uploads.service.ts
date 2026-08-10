import { ImageKitService } from '../../services/imagekit.service';
import { config } from '../../config/env';

export class UploadsService {
  static generateUploadSession(moduleName: string, documentType: string) {
    const authParams = ImageKitService.generateAuthenticationParameters();

    // Map module and document type to a structured folder path
    // e.g., trip_documents and POD -> /trip_documents/pod
    const sanitizedModule = moduleName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const sanitizedDocType = documentType.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const folder = `/${sanitizedModule}/${sanitizedDocType}/`;

    return {
      uploadToken: authParams.token,
      expireAt: authParams.expire,
      signature: authParams.signature,
      publicKey: config.imagekit.publicKey,
      folder,
    };
  }
}
