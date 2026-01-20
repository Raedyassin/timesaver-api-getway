import { BaseEntityProps } from 'src/common/entities/base.entity';
import { Roles } from 'src/common/enums/role.enum';
import { VideoChatSession } from 'src/modules/ai/entities/video-chat-session.entity';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer'; // 1. Import Exclude
@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntityProps {
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription[];

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ name: 'user_name', type: 'varchar' })
  userName: string;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @Column()
  email: string;

  @Column({ default: false, type: 'boolean', name: 'is_email_verified' })
  isEmailVerified: boolean;

  @OneToMany(() => VideoChatSession, (video) => video.user)
  videoChatSessions: VideoChatSession[]; // User has many videos
}
