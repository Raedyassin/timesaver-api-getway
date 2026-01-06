import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // Helper to convert Observable to Promise
import { RagService } from './services/Rag.service';
import { LoggerService } from '../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoChatSession } from './entities/video-chat-session.entity';

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly ragService: RagService,
    private readonly logger: LoggerService,
    @InjectRepository(VideoChatSession)
    private readonly videoChatSessionRepository: Repository<VideoChatSession>,
  ) {}

  async getSummary(youtubeUrl: string): Promise<any> {
    /**
     * Calls the Python FastAPI endpoint to get a summary.
     */
    try {
      const response = await firstValueFrom(
        this.httpService.post('/ai/summary', { youtubeUrl }),
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
      videoChatSession =
        await this.videoChatSessionRepository.save(videoChatSession);
      console.log('videoChatSession', videoChatSession);
      // process transcript with RAG
      await this.ragService.processVideoTranscript(
        videoChatSession.id,
        videoSummary.transcript as string,
      );

      return {
        data: {
          videoMetadata: videoSummary.video_metadata,
          summary: videoSummary.summary,
          sessionId: videoChatSession.id,
        },
      };
    } catch (error) {
      console.log('error', error);
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

  async askQuestion(question: string): Promise<any> {
    /**
     * Calls the Python FastAPI endpoint for Q/A
     */
    try {
      const response = await firstValueFrom(
        this.httpService.post('/ai/ask-question', { question }),
      );
      return response.data;
    } catch {
      throw new Error('Failed to ask question');
    }
  }
}
