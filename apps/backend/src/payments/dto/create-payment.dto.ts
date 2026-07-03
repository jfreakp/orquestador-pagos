import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  gatewayCode!: string;

  @IsString()
  @IsNotEmpty()
  channelCode!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
