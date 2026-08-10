import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';

export class PaymentsController {
  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentsService.recordPayment(req.body, req.user!.userId);
      return responseHelper.created(res, payment, 'Payment recorded successfully');
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

      const { data, total } = await PaymentsService.listPayments(query, skip, take);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentsService.getPayment(req.params.id);
      return responseHelper.success(res, payment, 'Payment retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getOutstanding(req: Request, res: Response, next: NextFunction) {
    try {
      const outstanding = await PaymentsService.getOutstanding(req.params.partyId);
      return responseHelper.success(res, outstanding, 'Outstanding retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentsService.cancelPayment(
        req.params.id,
        req.body,
        req.user!.userId,
      );
      return responseHelper.success(res, payment, 'Payment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
