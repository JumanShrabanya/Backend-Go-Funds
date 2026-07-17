import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/modules/users/entities/user.entity';
import { RefreshToken } from './src/modules/users/entities/refresh-token.entity';
import { OtpVerification } from './src/modules/users/entities/otp-verification.entity';
import { FundHouse } from './src/modules/funds/entities/fund-house.entity';
import { Fund } from './src/modules/funds/entities/fund.entity';

config(); 

const isSslEnabled = true; 

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || 'localhost',
  ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
  extra: isSslEnabled ? { ssl: { rejectUnauthorized: false } } : undefined,
  entities: [User, RefreshToken, OtpVerification, FundHouse, Fund],
  migrations: ['./src/migrations/*.ts'],
  synchronize: false,
});
