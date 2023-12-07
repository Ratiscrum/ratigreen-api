import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from 'src/services/prisma.service';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createMessageDto: CreateMessageDto, userId: number) {
    return this.prisma.message.create({
      data: {
        text: createMessageDto.text,
        question: {
          connect: {
            id: createMessageDto.questionId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.message.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return this.prisma.message.update({
      where: {
        id,
      },
      data: {
        text: updateMessageDto.text,
        updatedAt: new Date(),
      },
    });
  }

  remove(id: number) {
    return this.prisma.message.delete({
      where: {
        id,
      },
    });
  }
}
