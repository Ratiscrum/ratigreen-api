// CreateQuestionDto.ts
import { IsBoolean, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { CreateSourceDto } from './create-source.dto';
import { CreateDataDto } from './create-data.dto';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsBoolean()
  answer: boolean;

  // @IsNotEmpty()
  // @IsUrl()
  // imageUrl: string;

  @IsNotEmpty()
  sources: CreateSourceDto[];

  @IsNotEmpty()
  datas: CreateDataDto[];
}
