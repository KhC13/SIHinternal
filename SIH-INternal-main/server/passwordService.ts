import bcrypt from 'bcryptjs';

export interface PasswordHashingStrategy {
  hash(password: string): Promise<string>;
  verify(password: string, hashedPassword: string): Promise<boolean>;
}

export class PasswordService implements PasswordHashingStrategy {
  private static readonly saltRounds = 10;

  static async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required for hashing.');
    }

    return bcrypt.hash(password, PasswordService.saltRounds);
  }

  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required for verification.');
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      return false;
    }

    return bcrypt.compare(password, hashedPassword);
  }

  async hash(password: string): Promise<string> {
    return PasswordService.hash(password);
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return PasswordService.verify(password, hashedPassword);
  }
}

export const passwordService = new PasswordService();
