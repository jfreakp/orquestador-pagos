import { IsNotEmpty, IsString } from 'class-validator';

export class CreateErrorCategoryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
