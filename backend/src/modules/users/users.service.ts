import { UsersRepository } from './users.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { hashPassword } from '../../utils/auth';
import { UserRole, UserStatus, Prisma } from '@prisma/client';

export class UsersService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createUser(data: any) {
    const existing = await UsersRepository.findByUsername(data.username);
    if (existing) {
      throw new BusinessError('Username already exists');
    }

    const password_hash = await hashPassword(data.password);
    const user = await UsersRepository.create({
      full_name: data.full_name,
      username: data.username,
      mobile: data.mobile,
      role: data.role,
      status: UserStatus.ACTIVE,
      password_hash,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  }

  static async getUser(id: string) {
    const user = await UsersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  }

  static async listUsers() {
    const users = await UsersRepository.findAll({
      select: {
        id: true,
        full_name: true,
        username: true,
        mobile: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
    return users;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateUser(id: string, data: any) {
    const user = await UsersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const updated = await UsersRepository.update(id, data as Prisma.UserUpdateInput);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...safeUser } = updated;
    return safeUser;
  }

  static async updateStatus(id: string, status: UserStatus) {
    const user = await UsersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    if (user.role === UserRole.SUPER_ADMIN && status === UserStatus.INACTIVE) {
      throw new BusinessError('Cannot deactivate a SUPER_ADMIN');
    }

    await UsersRepository.update(id, { status });
  }

  static async resetPassword(id: string, newPassword: string) {
    const user = await UsersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const password_hash = await hashPassword(newPassword);
    await UsersRepository.update(id, { password_hash });
  }
}
