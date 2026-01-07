import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // Helper to convert Observable to Promise
import { RagService } from './services/Rag.service';
import { LoggerService } from '../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoChatSession } from './entities/video-chat-session.entity';
import { User } from '../user/entities/user.entity';
import { QuestionDto } from './dto/question';
import { ChatMessage } from './entities/chat-message.entity';
import { MessageType } from 'src/common/enums/message-type.enum';
import { RedisService } from '../redis/redis.service';
import { URLDto } from './dto/url';
import { HistoryQueryDto } from './dto/history-query.dto';
@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly ragService: RagService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    @InjectRepository(VideoChatSession)
    private readonly videoChatSessionRepository: Repository<VideoChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async getSummary(request: URLDto, userId: string): Promise<any> {
    /**
     * Calls the Python FastAPI endpoint to get a summary.
     */
    try {
      const response = await firstValueFrom(
        this.httpService.post('/ai/summary', {
          youtube_url: request.youtubeUrl,
          summary_instruction: request.summaryInstruction,
        }),
      );
      /**
       * the success response
       *  video_metadata=metadata,
          summary=summary,
          transcript=transcript_text, 
          transcript_available=bool
       */
      const videoSummary = response.data;
      if (!videoSummary.transcript_available) {
        throw new BadRequestException(
          'Could not generate summary because transcript is unavailable.',
        );
      }
      // store video in database for create a session for user
      let videoChatSession = new VideoChatSession();
      videoChatSession.title = videoSummary.video_metadata.title;
      videoChatSession.uploader = videoSummary.video_metadata.uploader;
      videoChatSession.uploadDate = videoSummary.video_metadata.upload_date;
      videoChatSession.duration = videoSummary.video_metadata.duration;
      videoChatSession.thumbnail = videoSummary.video_metadata.thumbnail;
      videoChatSession.webpageUrl = videoSummary.video_metadata.webpage_url;
      videoChatSession.summary = videoSummary.summary;
      videoChatSession.transcript = videoSummary.transcript;
      videoChatSession.summaryInstruction = request.summaryInstruction;
      videoChatSession.user = { id: userId } as User;
      videoChatSession =
        await this.videoChatSessionRepository.save(videoChatSession);
      // store transcript in redis to make FastAPI service can access if needed
      await this.redisService.set(
        `${videoChatSession.id}-video-metadata`,
        { transcript: videoSummary.transcript, summary: videoSummary.summary },
        60 * 60 * 3, // 3 hours
      );
      // process transcript with RAG
      await this.ragService.processVideoTranscript(
        videoChatSession.id,
        videoSummary.transcript as string,
      );
      // when user ask for summary we will create a id for his chat
      // so chatId is the id of videoChatSession
      return {
        data: {
          videoMetadata: videoSummary.video_metadata,
          summary: videoSummary.summary,
          chatId: videoChatSession.id,
        },
      };
    } catch (error) {
      if (error.response.status === 422) {
        throw new HttpException(
          'Invalid YouTube URL. Please provide a valid YouTube URL.',
          422,
        );
      }
      if (error.response.status === 400) {
        throw new BadRequestException('Video unavailable or restricted.');
      }
      this.logger.error('Error calling AI Service:', String(error));
      throw error;
    }
  }

  async askQuestion(question: QuestionDto, userId: string): Promise<any> {
    /**
     * Calls the Python FastAPI endpoint for Q/A
     */
    const { chatId: videoChatSessionId, question: userQuestion } = question;

    // check if videoChatSessionId is valid and if this caht for the his owner
    await this.getVideoChatSession(videoChatSessionId, userId);
    const lastFiveMessages = await this.chatMessageRepository.find({
      where: {
        videoChatSessionId,
        role: MessageType.USER,
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const lastFiveMessagesArray = lastFiveMessages.map(
      (message) => message.content,
    );
    const relativePartsFromTranscript =
      await this.ragService.processUserQuestion(
        videoChatSessionId,
        userQuestion,
      );

    try {
      const response = await firstValueFrom(
        this.httpService.post('/ai/ask-question', {
          video_chat_session_id: videoChatSessionId,
          question: userQuestion,
          relative_parts_from_transcript: relativePartsFromTranscript,
          // last few message is the last few user question
          last_few_message: lastFiveMessagesArray.reverse(),
        }),
      );

      await this.createAndSaveChatMessage(
        videoChatSessionId,
        MessageType.USER,
        userQuestion,
      );
      const responseMessage = await this.createAndSaveChatMessage(
        videoChatSessionId,
        MessageType.AI,
        response.data.answer as string,
      );
      return {
        data: {
          answer: {
            id: responseMessage.id,
            answer: responseMessage.content,
            createdAt: responseMessage.createdAt,
          },
        },
      };
    } catch (error) {
      console.log('error', error.response.data);
      if (error.response.status === 500 || error.response.status === 422) {
        this.logger.error(
          'Error calling ask-question AI Service:',
          String(error),
        );
        throw new InternalServerErrorException(
          'Sory something went wrong, please try again later.',
        );
      }
      throw new Error('Error calling ask-question AI Service:' + String(error));
    }
  }

  async getHistory(userId: string, query: HistoryQueryDto) {
    let videoChatSessions = await this.videoChatSessionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'title',
        'thumbnail',
        'createdAt',
        'title',
        'duration',
        'summaryInstruction',
        'uploadDate',
        'uploader',
        'webpageUrl',
        'summary',
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    if (videoChatSessions.length > query.limit) {
      videoChatSessions = videoChatSessions.slice(0, query.limit + 1);
    }
    return {
      data: {
        history: videoChatSessions,
      },
      meta: {
        hasMore: videoChatSessions.length > query.limit,
        page: query.page,
        limit: query.limit,
      },
    };
  }
  async getChatHistory(videoChatSessionId: string, userId: string) {
    await this.getVideoChatSession(videoChatSessionId, userId);
    const chatHistory = await this.chatMessageRepository.find({
      where: { videoChatSessionId },
      order: { createdAt: 'ASC' },
    });
    return {
      data: {
        chatHistory,
      },
    };
  }

  private async getVideoChatSession(
    videoChatSessionId: string,
    userId: string,
  ): Promise<void> {
    const videoChatSessionRedis = await this.redisService.get<VideoChatSession>(
      `${videoChatSessionId}-metadata`,
    );
    // if he is in redis then go
    if (videoChatSessionRedis) {
      if (videoChatSessionRedis.user?.id !== userId) {
        throw new BadRequestException('Unauthorized user for this chat');
      }
      return;
    }
    const videoChatSession = await this.videoChatSessionRepository.findOne({
      where: { id: videoChatSessionId },
      relations: ['user'],
    });
    if (!videoChatSession) {
      throw new BadRequestException('This chat not found');
    }
    if (videoChatSession.user.id !== userId) {
      throw new BadRequestException('Unauthorized user for this chat');
    }
    await this.redisService.set(
      `${videoChatSessionId}-metadata`,
      {
        ...videoChatSession,
        user: {
          id: videoChatSession.user.id,
        },
      },
      60 * 60 * 3, // 3 hours
    );
    return;
  }

  private async createAndSaveChatMessage(
    videoChatSessionId: string,
    role: MessageType,
    content: string,
  ) {
    const chatMessage = new ChatMessage();
    chatMessage.content = content;
    chatMessage.videoChatSessionId = videoChatSessionId;
    chatMessage.videoChatSession = {
      id: videoChatSessionId,
    } as VideoChatSession;
    chatMessage.role = role;
    return await this.chatMessageRepository.save(chatMessage);
  }
}
