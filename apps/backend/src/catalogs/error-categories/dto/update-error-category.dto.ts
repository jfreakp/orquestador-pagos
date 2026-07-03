import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateErrorCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
