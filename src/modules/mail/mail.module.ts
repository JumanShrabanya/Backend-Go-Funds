import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('app.mail.host'),
          port: configService.get<number>('app.mail.port'),
          secure: true,
          auth: {
            user: configService.get<string>('app.mail.user'),
            pass: configService.get<string>('app.mail.pass'),
          },
        },
        defaults: {
          from: configService.get<string>('app.mail.from'),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
