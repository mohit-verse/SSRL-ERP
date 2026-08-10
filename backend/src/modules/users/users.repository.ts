import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class UsersRepository {
  static async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }

  static async findAll(args: Prisma.UserFindManyArgs) {
    return prisma.user.findMany(args);
  }

  static async count(where?: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  }

  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }
}
