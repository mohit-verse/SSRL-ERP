import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class VehicleDirectoryRepository {
  static async findById(id: string) {
    return prisma.vehicleDirectory.findUnique({ where: { id } });
  }

  static async findAll(args: Prisma.VehicleDirectoryFindManyArgs) {
    return prisma.vehicleDirectory.findMany(args);
  }

  static async count(where?: Prisma.VehicleDirectoryWhereInput) {
    return prisma.vehicleDirectory.count({ where });
  }

  static async update(id: string, data: Prisma.VehicleDirectoryUpdateInput) {
    return prisma.vehicleDirectory.update({ where: { id }, data });
  }
}
