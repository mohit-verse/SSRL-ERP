import { Request, Response, NextFunction } from 'express';
import { NumberSequencesModuleService } from './number-sequences.service';
import * as responseHelper from '../../utils/response';
import { SequenceKey } from '@prisma/client';

export class NumberSequencesController {
  static async getCurrentSequences(req: Request, res: Response, next: NextFunction) {
    try {
      const sequences = await NumberSequencesModuleService.getCurrentSequences();
      return responseHelper.success(res, sequences, 'Current sequences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async previewNextNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.sequenceKey as SequenceKey;
      const preview = await NumberSequencesModuleService.previewNextNumber(key);
      return responseHelper.success(res, { preview }, 'Next number preview generated');
    } catch (error) {
      next(error);
    }
  }

  static async resetSequences(req: Request, res: Response, next: NextFunction) {
    try {
      // Body can contain optional prefix overrides { TRIP: "TR", BILL: "BL" }
      const prefixes = req.body.prefixes || {};
      const sequences = await NumberSequencesModuleService.resetForActiveFinancialYear(prefixes);
      return responseHelper.success(res, sequences, 'Sequences reset/initialized successfully');
    } catch (error) {
      next(error);
    }
  }
}
