import { Vehicle, VehicleOwnership } from '@/lib/types';
import { normalizeVehicleNumber } from '@/lib/utils/validation';

export interface CreateVehicleInput {
  vehicle_number: string;
  ownership_type: VehicleOwnership;
  owner_id?: string;
}

export class VehicleDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VehicleDomainError';
  }
}

export function validateVehicleInput(input: CreateVehicleInput): void {
  const normalizedNo = normalizeVehicleNumber(input.vehicle_number);
  if (!normalizedNo) {
    throw new VehicleDomainError('Vehicle number is required.');
  }

  if (input.ownership_type === 'MARKET' && !input.owner_id) {
    throw new VehicleDomainError('Market vehicles must have an associated Vehicle Owner.');
  }
}

export function prepareVehicleRecord(input: CreateVehicleInput): CreateVehicleInput {
  validateVehicleInput(input);
  return {
    vehicle_number: normalizeVehicleNumber(input.vehicle_number),
    ownership_type: input.ownership_type,
    owner_id: input.ownership_type === 'MARKET' ? input.owner_id : undefined,
  };
}
