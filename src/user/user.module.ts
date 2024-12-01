import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { EmailService } from 'src/auth/email.service';
import { ResetCode } from 'src/auth/entity/reset-code.dto';
import { User } from './entity/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetCode]),
    forwardRef(() => AuthModule),
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService, EmailService],
})
export class UserModule {}
