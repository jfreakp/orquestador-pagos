import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const PEM_PUBLIC_KEY_PREFIX = '-----BEGIN PUBLIC KEY-----';

export class UpdateClientSystemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^${PEM_PUBLIC_KEY_PREFIX}`), {
    message: `publicKey must be a PEM-encoded public key starting with "${PEM_PUBLIC_KEY_PREFIX}"`,
  })
  publicKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
