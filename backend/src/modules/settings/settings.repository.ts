import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class SettingsRepository {
  static async create(data: Prisma.SettingCreateInput) {
    return prisma.setting.create({ data });
  }

  static async findByKey(setting_key: string) {
    return prisma.setting.findUnique({ where: { setting_key } });
  }

  static async findAll() {
    return prisma.setting.findMany();
  }

  static async update(setting_key: string, data: Prisma.SettingUpdateInput) {
    return prisma.setting.update({ where: { setting_key }, data });
  }
}
