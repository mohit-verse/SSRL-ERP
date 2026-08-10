import ImageKit from 'imagekit';
import { config } from '../config/env';

export class ImageKitService {
  private static instance: ImageKit;

  private static getInstance(): ImageKit {
    if (!this.instance) {
      this.instance = new ImageKit({
        publicKey: config.imagekit.publicKey,
        privateKey: config.imagekit.privateKey,
        urlEndpoint: config.imagekit.urlEndpoint,
      });
    }
    return this.instance;
  }

  /**
   * Generates authentication parameters for client-side upload
   */
  static generateAuthenticationParameters() {
    const imagekit = this.getInstance();
    return imagekit.getAuthenticationParameters();
  }

  // Future methods: deleteFile, getFileDetails, etc.
}
