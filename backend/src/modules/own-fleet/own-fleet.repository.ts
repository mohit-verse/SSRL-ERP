import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class OwnFleetRepository {
  static async create(data: Prisma.OwnVehicleCreateInput) {
    return prisma.ownVehicle.create({ data });
  }

  static async findById(id: string) {
    return prisma.ownVehicle.findUnique({ where: { id } });
  }

  static async findByVehicleNumber(vehicle_number: string) {
    return prisma.ownVehicle.findUnique({ where: { vehicle_number } });
  }

  static async findAll(args: Prisma.OwnVehicleFindManyArgs) {
    return prisma.ownVehicle.findMany(args);
  }

  static async count(where?: Prisma.OwnVehicleWhereInput) {
    return prisma.ownVehicle.count({ where });
  }

  static async update(id: string, data: Prisma.OwnVehicleUpdateInput) {
    return prisma.ownVehicle.update({ where: { id }, data });
  }
}
