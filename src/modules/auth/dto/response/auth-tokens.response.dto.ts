import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../../users/dto/response/user.response.dto';

export class AuthTokensResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
