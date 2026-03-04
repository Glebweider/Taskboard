// src/user/user.module.ts

// ! lib
// nestjs
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ! own
// user
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { ProjectSchema, UserSchema } from '@Models';
import { AuthModule } from '@Auth/auth.module';
import { RedisModule } from '@Redis/redis.module';


@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'User', schema: UserSchema },
			{ name: 'Project', schema: ProjectSchema }
		]),
		forwardRef(() => AuthModule),
		RedisModule,
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService]
})
export class UserModule {}
