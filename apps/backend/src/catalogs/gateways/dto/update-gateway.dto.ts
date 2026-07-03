import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGatewayDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
