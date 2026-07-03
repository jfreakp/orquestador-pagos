import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGatewayOperationTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
