export interface LogAuditEventInput {
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  change_reason?: string;
  performed_by: string;
}
