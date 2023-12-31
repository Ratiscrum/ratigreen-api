import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { PrismaService } from 'src/services/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaClient } from '@prisma/client';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  controllers: [QuestionsController],
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    PrismaClient,
    MessagesModule,
  ],
  providers: [QuestionsService, PrismaService],
})
export class QuestionsModule {}
