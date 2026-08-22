import { LogAuditEventInput } from './types';
import { AuditLog } from '@/lib/types';

export interface IAuditService {
  logEvent(input: LogAuditEventInput): Promise<AuditLog>;
}

export class AuditService implements IAuditService {
  async logEvent(_input: LogAuditEventInput): Promise<AuditLog> {
    throw new Error('AuditService.logEvent not implemented in Phase 1 foundation.');
  }
}
