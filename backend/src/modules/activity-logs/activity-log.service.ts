import { ActivitySource, Prisma } from '@prisma/client';

export class ActivityLogService {
  static async log(
    tx: Prisma.TransactionClient,
    params: {
      userId?: string;
      source?: ActivitySource;
      module: string;
      entityType: string;
      entityId?: string;
      action: string;
      description?: string;
    },
  ) {
    return tx.activityLog.create({
      data: {
        user_id: params.userId,
        source: params.source || ActivitySource.API,
        module: params.module,
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        description: params.description,
      },
    });
  }
}
