import { VehicleDirectoryRepository } from './vehicle-directory.repository';
import { NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';

export class VehicleDirectoryService {
  static async listVehicles(query: string, skip: number, take: number) {
    const where: Prisma.VehicleDirectoryWhereInput = {};
    if (query) {
      Object.assign(
        where,
        buildSearchCondition(['vehicle_number', 'owner_name', 'owner_mobile'], query),
      );
    }

    const [data, total] = await Promise.all([
      VehicleDirectoryRepository.findAll({ where, skip, take, orderBy: { updated_at: 'desc' } }),
      VehicleDirectoryRepository.count(where),
    ]);

    return { data, total };
  }

  static async getVehicle(id: string) {
    const vehicle = await VehicleDirectoryRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateOwner(id: string, data: any) {
    const vehicle = await VehicleDirectoryRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    return VehicleDirectoryRepository.update(id, {
      owner_name: data.owner_name,
      owner_mobile: data.owner_mobile,
    });
  }

  static async getVehicleHistory(id: string) {
    const vehicle = await VehicleDirectoryRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    // In future phases, this will query trips table for trip history of this vehicle
    return {
      vehicle,
      history: [],
      message: 'Trip history will be implemented in future phases',
    };
  }
}
