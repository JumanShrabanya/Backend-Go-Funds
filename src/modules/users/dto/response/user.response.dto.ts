import { Expose } from 'class-transformer';
import { UserRole } from '../../../../common/enums/user-role.enum';

/**
 * Shape of the user object returned in all API responses.
 * Never exposes passwordHash or internal DB fields.
 */
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: UserRole;

  @Expose()
  isActive: boolean;

  // Profile-completion fields — null until the user fills them in
  @Expose()
  phoneCountryCode: string | null;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  dateOfBirth: Date | null;

  @Expose()
  annualIncome: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
