import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateSourceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsUrl()
  link: string;
}
