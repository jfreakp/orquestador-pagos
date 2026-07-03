import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateGatewayConfigDto {
  @IsOptional()
  @IsObject()
  credentialsPlain?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
