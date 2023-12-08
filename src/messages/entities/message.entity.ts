import { Message, Question } from '@prisma/client';
import { UserEntity } from 'src/users/entities/user.entity';

export class MessageEntity implements Message {
  id: number;
  text: string;
  user: UserEntity;
  userId: number;
  question: Question;
  questionId: number;
  createdAt: Date;
  updatedAt: Date;
}
