export type UserRole = 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

/**
 * Maps Java UserManagementDto (from UserManagementDto.java)
 */
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}
