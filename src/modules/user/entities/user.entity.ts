import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  password: string;

  @Column({ name: 'user_name', type: 'varchar' })
  userName: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false, type: 'boolean', name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ default: true, type: 'boolean', name: 'is_active' })
  isActive: boolean;
}
