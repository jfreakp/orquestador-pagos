import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { EncryptionService } from './encryption.service';

function buildService(masterKey: string | undefined): EncryptionService {
  const configService = {
    get: jest.fn().mockReturnValue(masterKey),
  } as unknown as ConfigService;
  return new EncryptionService(configService);
}

describe('EncryptionService', () => {
  const masterKey = randomBytes(32).toString('base64');

  it('decrypts back to the exact original object', () => {
    const service = buildService(masterKey);
    const original = {
      merchantId: 'abc-123',
      amount: 42.5,
      nested: { channel: 'WEB', tags: ['a', 'b'] },
    };

    const encrypted = service.encrypt(original);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toEqual(original);
  });

  it('produces a different ciphertext each time due to a random IV', () => {
    const service = buildService(masterKey);
    const original = { foo: 'bar' };

    const first = service.encrypt(original);
    const second = service.encrypt(original);

    expect(first.equals(second)).toBe(false);
    expect(service.decrypt(first)).toEqual(original);
    expect(service.decrypt(second)).toEqual(original);
  });

  it('fails to decrypt if the ciphertext was tampered with', () => {
    const service = buildService(masterKey);
    const encrypted = service.encrypt({ foo: 'bar' });
    encrypted[encrypted.length - 1] ^= 0xff;

    expect(() => service.decrypt(encrypted)).toThrow();
  });

  it('throws if APP_ENCRYPTION_MASTER_KEY is missing', () => {
    expect(() => buildService(undefined)).toThrow(
      'APP_ENCRYPTION_MASTER_KEY is not set',
    );
  });

  it('throws if APP_ENCRYPTION_MASTER_KEY does not decode to 32 bytes', () => {
    const shortKey = randomBytes(16).toString('base64');
    expect(() => buildService(shortKey)).toThrow(
      'APP_ENCRYPTION_MASTER_KEY must decode to 32 bytes',
    );
  });
});
