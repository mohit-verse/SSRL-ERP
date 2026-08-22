import { Driver } from '@/lib/types';
import { normalizePhoneNumber } from '@/lib/utils/validation';

export interface CreateDriverInput {
  name: string;
  phone?: string;
  license_number?: string;
}

export class DriverDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriverDomainError';
  }
}

export function validateDriverInput(input: CreateDriverInput): void {
  const trimmedName = input.name ? input.name.trim() : '';
  if (!trimmedName) {
    throw new DriverDomainError('Driver name is required.');
  }
}

export function prepareDriverRecord(input: CreateDriverInput): CreateDriverInput {
  validateDriverInput(input);
  return {
    name: input.name.trim(),
    phone: input.phone ? normalizePhoneNumber(input.phone) : undefined,
    license_number: input.license_number ? input.license_number.trim().toUpperCase() : undefined,
  };
}
