import { config } from '../config/env';

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : '',
    );
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : '',
    );
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  debug: (message: string, meta?: unknown) => {
    if (config.env !== 'production') {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        meta ? JSON.stringify(meta) : '',
      );
    }
  },
};

export interface IActivityLogService {
  logActivity(params: {
    userId?: string;
    source: 'UI' | 'API' | 'SYSTEM' | 'MIGRATION';
    module: string;
    entityType: string;
    entityId?: string;
    action: string;
    description?: string;
  }): Promise<void>;
}
