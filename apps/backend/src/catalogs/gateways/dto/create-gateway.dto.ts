import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGatewayDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
