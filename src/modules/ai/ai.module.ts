import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RagService } from './services/Rag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { VideoChatSession } from './entities/video-chat-session.entity';
import { EmbeddingModelService } from './services/embedding.service';
import { VectorDBService } from './services/vector-db.service';
import { ModelUsageFactory } from './services/model-factory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, VideoChatSession]),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // 1. The Base URL of your Python/FastAPI Server
        baseURL: configService.getOrThrow<string>('AI_SERVICE_URL'), // e.g., 'http://localhost:8000'

        // 2. Default Headers: This is the magic part!
        // Every request sent from this AiService will automatically have this header.
        headers: {
          'Content-Type': 'application/json',
          /**
           * we should use HTTPS for encrypt the API_KEY when we send it to
           * ai service
           */
          'X-Internal-API-Key': configService.getOrThrow<string>(
            'AI_SERVICE_SECRET_KEY',
          ),
        },

        // 3. Timeout: AI processing can be slow, so we give it 60 seconds.
        // timeout: 60000 * 5, // 5 minutes
        // timeout: configService.getOrThrow<number>('AI_SERVICE_TIMEOUT'),
      }),
    }),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    EmbeddingModelService,
    RagService,
    VectorDBService,
    ModelUsageFactory,
  ],
})
export class AiModule {}
