import { SettingsRepository } from './settings.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';

export class SettingsService {
  static async listSettings() {
    return SettingsRepository.findAll();
  }

  static async getSetting(key: string) {
    const setting = await SettingsRepository.findByKey(key);
    if (!setting) throw new NotFoundError('Setting not found');
    return setting;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createSetting(data: any, userId: string) {
    if (data.setting_key.toLowerCase().includes('imagekit')) {
      throw new BusinessError('ImageKit credentials shall NOT be configurable via UI');
    }

    const existing = await SettingsRepository.findByKey(data.setting_key);
    if (existing) {
      throw new BusinessError('Setting key already exists');
    }

    return SettingsRepository.create({
      setting_key: data.setting_key,
      setting_value: data.setting_value,
      category: data.category,
      description: data.description,
      updated_by_user: {
        connect: { id: userId },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateSetting(key: string, data: any, userId: string) {
    if (key.toLowerCase().includes('imagekit')) {
      throw new BusinessError('ImageKit credentials shall NOT be configurable via UI');
    }

    const setting = await SettingsRepository.findByKey(key);
    if (!setting) throw new NotFoundError('Setting not found');

    return SettingsRepository.update(key, {
      ...data,
      updated_by_user: {
        connect: { id: userId },
      },
    });
  }
}
