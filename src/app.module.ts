import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CardModule } from './card/card.module';
import { CommonModule } from './common/common.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [AuthModule, UserModule, CardModule, CommonModule, TagModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
