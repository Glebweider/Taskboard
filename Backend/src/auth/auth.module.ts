// src/auth/auth.module.ts

// ! lib
// nestjs
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

// ! own
// common
import { UserSchema } from '@Models/index';
// auth
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// logger
import { UserModule } from '@User/user.module';
import { RedisModule } from '@Redis/redis.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
		JwtModule.register({
			secret: 'secret',
			signOptions: { expiresIn: '7d' }
		}),
		UserModule,
		RedisModule
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService]
})
export class AuthModule {}
