import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGatewayOperationTypeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
