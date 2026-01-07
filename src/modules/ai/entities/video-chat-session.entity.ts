import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('video_chat_sessions')
export class VideoChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string; // THIS IS THE SESSION ID

  @ManyToOne(() => User, (user) => user.videoChatSessions)
  user: User;

  // video meta_data
  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  uploader: string;

  @Column({ name: 'upload_date', nullable: true })
  uploadDate: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ name: 'webpage_url', nullable: true })
  webpageUrl: string;
  // ********************* end **********************

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  transcript: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChatMessage, (msg) => msg.videoChatSession)
  messages: ChatMessage[]; // Session has many messages

  // this for summary last few messages
  // @Column('text', { nullable: true })
  // contextSummary: string; // Compressed conversation memory
}
