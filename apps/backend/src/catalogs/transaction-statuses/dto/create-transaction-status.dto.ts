import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTransactionStatusDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
