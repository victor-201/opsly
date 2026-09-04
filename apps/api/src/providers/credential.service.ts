import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CredentialService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(private config: ConfigService) {
    const hexKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!hexKey || hexKey.length < 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(data: Record<string, string>): {
    encryptedData: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const plaintext = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = (cipher as any).getAuthTag();

    return { encryptedData: encrypted, iv, authTag };
  }

  decrypt(encryptedData: Buffer, iv: Buffer, authTag: Buffer): Record<string, string> {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    (decipher as any).setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}
