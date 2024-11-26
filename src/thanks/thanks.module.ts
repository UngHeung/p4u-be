import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { Reaction } from './entity/reaction.entity';
import { Thanks } from './entity/thanks.entity';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { ThanksController } from './thanks.controller';
import { ThanksService } from './thanks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Thanks, Reaction]),
    UserModule,
    AuthModule,
  ],
  controllers: [ThanksController, ReactionsController],
  providers: [ThanksService, ReactionsService],
  exports: [ThanksService, ReactionsService],
})
export class ThanksModule {}
