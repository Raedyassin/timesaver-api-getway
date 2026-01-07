import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { VideoChatSession } from './video-chat-session.entity';
import { MessageType } from 'src/common/enums/message-type.enum';

/**
 * Explanation:
    1. Stores each message in a session.
    2. Helps generate contextSummary for memory compression.
    3. Only last few messages + contextSummary will be sent to FastAPI to save cost.
 */
@Entity('chat_messages')
export class ChatMessage {
  // ✅ ADD THIS: Explicit Foreign Key Column
  // This makes your query `where: { videoChatSessionId }` work perfectly.
  @Column()
  videoChatSessionId: string;

  // @ManyToOne(() => VideoChatSession)
  // videoChatSession: VideoChatSession;
  @ManyToOne(() => VideoChatSession, (session) => session.messages, {
    // ✅ ADD THIS: If Session is deleted, delete messages too
    onDelete: 'CASCADE',
  })
  // Connect the column explicitly
  @JoinColumn({ name: 'videoChatSessionId' })
  videoChatSession: VideoChatSession;

  @Column({ type: 'enum', enum: MessageType })
  role: MessageType;

  @Column('text')
  content: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
