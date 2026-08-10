import { OwnFleetRepository } from './own-fleet.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { Prisma, VehicleStatus } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';

export class OwnFleetService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createVehicle(data: any) {
    const existing = await OwnFleetRepository.findByVehicleNumber(data.vehicle_number);
    if (existing) {
      throw new BusinessError('Vehicle number already exists in Own Fleet');
    }

    return OwnFleetRepository.create({
      vehicle_number: data.vehicle_number,
      vehicle_type: data.vehicle_type,
      brand: data.brand,
      model: data.model,
      manufacturing_year: data.manufacturing_year,
      chassis_number: data.chassis_number,
      engine_number: data.engine_number,
      registration_date: data.registration_date ? new Date(data.registration_date) : null,
      purchase_date: data.purchase_date ? new Date(data.purchase_date) : null,
      status: data.status,
    });
  }

  static async listVehicles(query: string, skip: number, take: number, status?: VehicleStatus) {
    const where: Prisma.OwnVehicleWhereInput = {};
    if (query) {
      Object.assign(
        where,
        buildSearchCondition(['vehicle_number', 'brand', 'model', 'vehicle_type'], query),
      );
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      OwnFleetRepository.findAll({ where, skip, take, orderBy: { vehicle_number: 'asc' } }),
      OwnFleetRepository.count(where),
    ]);

    return { data, total };
  }

  static async getVehicle(id: string) {
    const vehicle = await OwnFleetRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateVehicle(id: string, data: any) {
    const vehicle = await OwnFleetRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (data.vehicle_number && data.vehicle_number !== vehicle.vehicle_number) {
      const existing = await OwnFleetRepository.findByVehicleNumber(data.vehicle_number);
      if (existing) throw new BusinessError('Vehicle number already exists in Own Fleet');
    }

    const updateData: Prisma.OwnVehicleUpdateInput = {
      vehicle_number: data.vehicle_number,
      vehicle_type: data.vehicle_type,
      brand: data.brand,
      model: data.model,
      manufacturing_year: data.manufacturing_year,
      chassis_number: data.chassis_number,
      engine_number: data.engine_number,
      status: data.status,
    };

    if (data.registration_date !== undefined) {
      updateData.registration_date = data.registration_date
        ? new Date(data.registration_date)
        : null;
    }
    if (data.purchase_date !== undefined) {
      updateData.purchase_date = data.purchase_date ? new Date(data.purchase_date) : null;
    }

    return OwnFleetRepository.update(id, updateData);
  }

  static async updateStatus(id: string, status: VehicleStatus) {
    const vehicle = await OwnFleetRepository.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return OwnFleetRepository.update(id, { status });
  }
}
