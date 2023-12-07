import { MessageEntity } from '../entities/message.entity';
import { PickType } from '@nestjs/mapped-types';

export class CreateMessageDto extends PickType(MessageEntity, ['text']) {}
