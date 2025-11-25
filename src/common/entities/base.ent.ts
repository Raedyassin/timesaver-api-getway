import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntityProps {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date; // automatically set when entity is first inserted

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date; // automatically updated whenever entity is updated

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date; // to make soft delete use softRemove() or softDelete()
  /**
   * [Soft Delete effects]
   * TypeORM sets deletedAt to the current timestamp.
   * The row is not physically removed from the database.
   * By default, all queries ignore rows where deletedAt is not null.
   * ****************
   *
   * Including Soft-Deleted Rows use withDeleted: true
   * example
   *   const video = await videoRepository.find({ withDeleted: true });
   *
   * ****************
   * [Problem]
   *  when your is delete his account and resignup by the same email will make
   * conflict because the email is unique (and we can't block the email)
   * so after handel this see this issue
   *
   */
}
