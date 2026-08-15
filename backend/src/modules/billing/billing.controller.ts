import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';
import { BillingType } from '@prisma/client';
import { BillPdfService } from '../../services/pdf/bill-pdf.service';

export class BillingController {
  static async getEligibleTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const partyId = req.query.party_id as string;
      const billingType = req.query.billing_type as BillingType;
      const trips = await BillingService.getEligibleTrips(partyId, billingType);
      return responseHelper.success(res, trips, 'Eligible trips retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async generateBill(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillingService.generateBill(req.body, req.user!.userId);
      return responseHelper.created(res, bill, 'Bill generated successfully');
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

      const { data, total } = await BillingService.listBills(query, skip, take);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Bills retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillingService.getBill(req.params.id);
      return responseHelper.success(res, bill, 'Bill retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillingService.cancelBill(req.params.id, req.body, req.user!.userId);
      return responseHelper.success(res, bill, 'Bill cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const orientation = req.query.orientation as 'portrait' | 'landscape';
      const billId = req.params.id;

      // Ensure the bill and full hierarchy exists and fetch it
      const billDetails = await BillingService.getBillWithFullHierarchy(billId);

      const buffer = await BillPdfService.generateBillPdf(billDetails, orientation);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Bill_${billDetails.bill_number}.pdf`,
      );
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
