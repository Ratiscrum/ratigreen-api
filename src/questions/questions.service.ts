import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
//import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from '@prisma/client';
import { unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async createQuestion(data: CreateQuestionDto): Promise<Question> {
    try {
      return this.prisma.question.create({
        data: {
          title: data.title,
          answer: data.answer,
          imageUrl: '',
          sources: {
            create: data.sources,
          },
          datas: {
            create: data.datas,
          },
        },
        include: {
          datas: true,
          sources: true,
        },
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getImage(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });
    return question.imageUrl;
  }

  async addImage(id: number, image: string) {
    return this.prisma.question.update({
      where: { id },
      data: {
        imageUrl: image,
      },
    });
  }

  /**
   * Get a question by id
   * @param id The id of the question
   * @returns A Question entity with its choices and indicator coefficients
   */
  async getQuestion(questionId: number) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        messages: true, // Assuming you want to retrieve messages as well
        datas: true,
        sources: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return question;
  }

  async getQuestions() {
    return this.prisma.question.findMany({
      include: {
        messages: true, // Assuming you want to retrieve messages as well
        datas: true,
        sources: true,
      },
    });
  }

  // async updateQuestion(id: number, data: UpdateQuestionDto) {
  //   return this.prisma.question.update({
  //     where: { id },
  //     data,
  //     include: {
  //       choices: true,
  //     },
  //   });
  // }

  async deleteQuestion(id: number) {
    try {
      // delete the image of the question inside the uploads folder
      const question = await this.prisma.question.findUnique({
        where: { id },
      });
      if (question.imageUrl) {
        const filePath = join(process.cwd(), 'uploads', question.imageUrl);
        unlinkSync(filePath);
      }

      return this.prisma.question.delete({
        where: { id },
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
