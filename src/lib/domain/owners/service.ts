import { VehicleOwner } from '@/lib/types';
import { isValidPAN, normalizePhoneNumber, maskBankDetails } from '@/lib/utils/validation';

export interface CreateOwnerInput {
  name: string;
  phone?: string;
  pan_number?: string;
  bank_details?: Record<string, unknown>;
  address?: string;
}

export class OwnerDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnerDomainError';
  }
}

export function validateOwnerInput(input: CreateOwnerInput): void {
  const trimmedName = input.name ? input.name.trim() : '';
  if (!trimmedName) {
    throw new OwnerDomainError('Vehicle Owner name is required.');
  }

  if (input.pan_number && !isValidPAN(input.pan_number)) {
    throw new OwnerDomainError('Invalid PAN number format. Expected format: ABCDE1234F');
  }
}

export function prepareOwnerRecord(input: CreateOwnerInput): CreateOwnerInput {
  validateOwnerInput(input);
  return {
    name: input.name.trim(),
    phone: input.phone ? normalizePhoneNumber(input.phone) : undefined,
    pan_number: input.pan_number ? input.pan_number.trim().toUpperCase() : undefined,
    bank_details: input.bank_details || {},
    address: input.address ? input.address.trim() : undefined,
  };
}

export function sanitizeOwnerForList(owner: VehicleOwner): VehicleOwner {
  return {
    ...owner,
    bank_details: maskBankDetails(owner.bank_details),
  };
}
