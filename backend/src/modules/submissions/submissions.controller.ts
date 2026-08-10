import { Request, Response, NextFunction } from 'express';
import { SubmissionsService } from './submissions.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';

export class SubmissionsController {
  static async getEligibleBills(req: Request, res: Response, next: NextFunction) {
    try {
      const partyId = req.query.party_id as string;
      const bills = await SubmissionsService.getEligibleBills(partyId);
      return responseHelper.success(res, bills, 'Eligible bills retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await SubmissionsService.createSubmission(req.body, req.user!.userId);
      return responseHelper.created(res, submission, 'Submission created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { skip, take } = getPaginationOptions(page, limit);
      const query = (req.query.q as string) || '';

      const { data, total } = await SubmissionsService.listSubmissions(query, skip, take);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Submissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await SubmissionsService.getSubmission(req.params.id);
      return responseHelper.success(res, submission, 'Submission retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async reissue(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await SubmissionsService.reissueSubmission(
        req.params.id,
        req.body,
        req.user!.userId,
      );
      return responseHelper.created(res, submission, 'Submission reissued successfully');
    } catch (error) {
      next(error);
    }
  }
}
