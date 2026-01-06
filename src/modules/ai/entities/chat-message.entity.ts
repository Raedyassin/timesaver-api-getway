import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { VideoChatSession } from './video-chat-session.entity';

/**
 * Explanation:
    1. Stores each message in a session.
    2. Helps generate contextSummary for memory compression.
    3. Only last few messages + contextSummary will be sent to FastAPI to save cost.
 */
@Entity('chat_messages')
export class ChatMessage {
  @ManyToOne(() => VideoChatSession)
  videoChatSession: VideoChatSession;

  @Column({ type: 'enum', enum: ['user', 'ai'] })
  role: 'user' | 'ai';

  @Column('text')
  content: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
