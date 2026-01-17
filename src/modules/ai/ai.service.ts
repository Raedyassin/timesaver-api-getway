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
import { ModelUsageFactory } from './services/model-factory.service';
import { UserService } from '../user/user.service';
import { UsageTokens } from 'src/common/interfaces/llm-models-strategy.interface';
import { LlmModels } from 'src/common/enums/llm-models.enum';
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
    private modelUsageFactory: ModelUsageFactory,
  ) {}

  async getSummary(request: URLDto, user: User): Promise<any> {
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
          input_tokens=input_tokens
          output_tokens=output_tokens
          llm_model=model_name
       */
      const videoSummary = response.data;
      if (!videoSummary.transcript_available) {
        throw new BadRequestException(
          'Could not generate summary because transcript is unavailable.',
        );
      }
      console.log(videoSummary);
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
      videoChatSession.user = { id: user.id } as User;
      videoChatSession =
        await this.videoChatSessionRepository.save(videoChatSession);
      // store transcript in redis to make FastAPI service can access if needed
      await this.redisService.set(
        `${videoChatSession.id}-video-metadata`,
        { transcript: videoSummary.transcript, summary: videoSummary.summary },
        60 * 60 * 3, // 3 hours
      );
      // calc the price
      this.calcPrice(user, videoSummary.llm_model as LlmModels, {
        inputTokens: videoSummary.input_tokens,
        outputTokens: videoSummary.output_tokens,
      });
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

  async askQuestion(question: QuestionDto, user: User): Promise<any> {
    /**
     * Calls the Python FastAPI endpoint for Q/A
     */
    const { chatId: videoChatSessionId, question: userQuestion } = question;

    // check if videoChatSessionId is valid and if this caht for the his owner
    await this.checkVideoChatSessionForUser(videoChatSessionId, user.id);
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
      this.calcPrice(user, response.data.llm_model as LlmModels, {
        inputTokens: response.data.input_tokens,
        outputTokens: response.data.output_tokens,
      });

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
    await this.checkVideoChatSessionForUser(videoChatSessionId, userId);
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

  private async checkVideoChatSessionForUser(
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

  private calcPrice(
    user: User,
    llm: LlmModels,
    { inputTokens, outputTokens }: UsageTokens,
  ) {
    const agentStrategy = this.modelUsageFactory.getStrategy(llm);
    const credits = agentStrategy.calculateCost({
      inputTokens,
      outputTokens,
    }).creditsUsed;
    // const subscription =
  }
}
// 1. System Improvements & Code Review
// Your code is generally good, but there is one major bottleneck that will kill your VPS performance if you don't fix it.

// The Problem: "Blocking Architecture"
// Currently, NestJS calls FastAPI using this.httpService.post(...). This is a Synchronous call in the context of the HTTP connection.

// User clicks "Summary" -> NestJS waits -> FastAPI waits (20s) -> User gets response.
// While NestJS waits, it is holding open a connection and potentially occupying a worker thread.
// The Improvement: "Job Queue Pattern"
// To handle "1000 users," you cannot make users wait for the AI to finish. You must use Redis as a Queue (e.g., BullMQ).

// Workflow Change:

// NestJS: Receives request -> Pushes job to Redis (summary-job) -> Returns "202 Accepted" (Job ID) to Frontend.
// FastAPI: Has a background worker running. It pulls the job from Redis, processes the AI, and saves the result to DB.
// Frontend: Polls NestJS GET /status/{job_id} every 2 seconds.
// Why this matters:

// Capacity: Allows NestJS to handle 100 requests/second instantly (just putting them in line).
// Stability: If FastAPI crashes, the jobs stay in Redis and process when it restarts.
