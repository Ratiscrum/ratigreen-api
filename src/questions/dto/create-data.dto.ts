import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateDataDto {
  @IsNotEmpty()
  @IsInt()
  value: number;

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsString()
  explanation: string;
}
