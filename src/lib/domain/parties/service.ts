import { Party, Profile } from '@/lib/types';
import { requirePermission } from '@/lib/security/rbac';
import { isValidGSTIN, isValidEmail, normalizePhoneNumber } from '@/lib/utils/validation';

export interface CreatePartyInput {
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export class PartyDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartyDomainError';
  }
}

export function validatePartyInput(input: CreatePartyInput): void {
  const trimmedName = input.name ? input.name.trim() : '';
  if (!trimmedName) {
    throw new PartyDomainError('Party name is required and cannot be empty.');
  }

  if (input.gstin && !isValidGSTIN(input.gstin)) {
    throw new PartyDomainError('Invalid GSTIN format. Expected format: e.g. 22AAAAA0000A1Z5');
  }

  if (input.email && !isValidEmail(input.email)) {
    throw new PartyDomainError('Invalid email address format.');
  }
}

export function preparePartyRecord(input: CreatePartyInput): CreatePartyInput {
  validatePartyInput(input);
  return {
    name: input.name.trim(),
    gstin: input.gstin ? input.gstin.trim().toUpperCase() : undefined,
    phone: input.phone ? normalizePhoneNumber(input.phone) : undefined,
    email: input.email ? input.email.trim().toLowerCase() : undefined,
    address: input.address ? input.address.trim() : undefined,
  };
}
