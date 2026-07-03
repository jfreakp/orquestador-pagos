import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTransactionStatusDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
