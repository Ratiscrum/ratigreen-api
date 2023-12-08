import { MessageEntity } from '../entities/message.entity';
import { PickType } from '@nestjs/mapped-types';

export class UpdateMessageDto extends PickType(MessageEntity, ['id', 'text']) {}
