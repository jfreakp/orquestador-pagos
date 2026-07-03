import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClientSystemDto } from './create-client-system.dto';

describe('CreateClientSystemDto', () => {
  const base = {
    code: 'SYS_A',
    name: 'Sistema A',
  };

  it('accepts a PEM-encoded public key', async () => {
    const dto = plainToInstance(CreateClientSystemDto, {
      ...base,
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a publicKey that does not start with the PEM header', async () => {
    const dto = plainToInstance(CreateClientSystemDto, {
      ...base,
      publicKey: 'not-a-pem-key',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('publicKey');
  });

  it('rejects a missing publicKey', async () => {
    const dto = plainToInstance(CreateClientSystemDto, base);

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'publicKey')).toBe(true);
  });
});
