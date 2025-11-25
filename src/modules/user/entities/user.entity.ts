import { BaseEntityProps } from 'src/common/entities/base.ent';
import { Roles } from 'src/common/enums/role.enum';
import { Entity, Column } from 'typeorm';

@Entity('users')
export class User extends BaseEntityProps {
  @Column({ nullable: true })
  password: string;

  @Column({ name: 'user_name', type: 'varchar' })
  userName: string;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @Column({ unique: true })
  email: string;

  @Column({ default: false, type: 'boolean', name: 'is_email_verified' })
  isEmailVerified: boolean;
}
