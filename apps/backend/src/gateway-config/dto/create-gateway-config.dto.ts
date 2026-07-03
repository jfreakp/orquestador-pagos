import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGatewayConfigDto {
  @IsString()
  @IsNotEmpty()
  gatewayCode!: string;

  @IsString()
  @IsNotEmpty()
  channelCode!: string;

  @IsObject()
  @IsNotEmpty()
  credentialsPlain!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
