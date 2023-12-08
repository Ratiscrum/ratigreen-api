import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
//import { UpdateQuestionDto } from './dto/update-question.dto';
import { Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMessageDto } from 'src/messages/dto/create-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { Public } from 'src/decorators/public.decorator';

@Public()
@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  constructor(
    private readonly questionsService: QuestionsService,
    private readonly messageService: MessagesService,
  ) {}

  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto, @Res() res) {
    try {
      const createdQuestion =
        await this.questionsService.createQuestion(createQuestionDto);
      this.logger.log('Question created successfully');
      return res.status(200).send({
        ...createdQuestion,
        message: 'Question created successfully',
      });
    } catch (e) {
      this.logger.error(e);
      res.status(400).send('An error occured while creating the question');
    }
  }

  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('image'))
  createImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const filename = file.filename;
      this.questionsService.addImage(Number(id), filename);
      this.logger.log('Image uploaded successfully');
      return res.status(200).send('Image uploaded successfully');
    } catch (e) {
      this.logger.error(e);
      res.status(400).send('An error occured while uploading the image');
    }
  }

  @Post(':id/message')
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Param('id') id: string,
    @Res() res,
    @Req() req,
  ) {
    try {
      const createdMessage = await this.messageService.create(
        {
          text: createMessageDto.text,
        },
        +id,
        req.user.id,
      );
      this.logger.log('Message created successfully');
      return res.status(200).send(createdMessage);
    } catch (e) {
      this.logger.error(e);
      res.status(400).send('An error occured while creating the message');
    }
  }

  @Get('image/:imagePath')
  getImage(@Param('imagePath') image: string, @Res() res) {
    try {
      res.setHeader('Content-Type', 'image/jpeg');
      this.logger.log('Image retrieved successfully');
      return res.status(200).sendFile(image, { root: 'uploads' });
    } catch (e) {
      this.logger.error(e);
      res.status(400).send('An error occured while retrieving the image');
    }
  }

  @Get()
  findAll() {
    return this.questionsService.getQuestions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.getQuestion(+id);
  }

  // @Put(':id')
  // updateFull(
  // @Param('id') id: string,
  // @Body() updateQuestionDto: UpdateQuestionDto,
  // ) {
  // return this.questionsService.updateQuestion(+id, updateQuestionDto);
  // }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      await this.questionsService.deleteQuestion(+id);
      this.logger.log('Question deleted');
      res.status(200).send('Question deleted');
    } catch (e) {
      this.logger.error(e);
      res.status(404).send("A question with this id doesn't exist");
    }
  }
}
