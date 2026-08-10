import { Request, Response, NextFunction } from 'express';
import { UploadsService } from './uploads.service';
import * as responseHelper from '../../utils/response';

export class UploadsController {
  static createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { module, documentType } = req.body;
      const session = UploadsService.generateUploadSession(module, documentType);

      return responseHelper.success(res, session, 'Upload session generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
