import { SetMetadata } from '@nestjs/common';
export const USER_ROLES_KEY = 'roles';
export const UserRoles = (...roles: string[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
