// src/project/project.module.ts

// ! lib
// nestjs
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ! own
// user
import { ProjectController } from './project.controller';
import { ProjectService } from './service/project.service';
// models
import { ProjectSchema, UserSchema } from '@Models';
import { AuthModule } from '@Auth/auth.module';
import { DDiscordModule } from '@Discord/discord.module';
import { RedisModule } from '@Redis/redis.module';
import { SseModule } from '@Sse/sse.module';
import { ActivityModule } from '@Activity/activity.module';
import { GoogleModule } from '@Google/google.module';
import { BoardService } from './service/board.service';
import { ListService } from './service/list.service';
import { CardService } from './service/card.service';


@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Project', schema: ProjectSchema },
			{ name: 'User', schema: UserSchema },
		]),
		forwardRef(() => AuthModule),
		forwardRef(() => DDiscordModule),
		RedisModule,
		SseModule,
		ActivityModule,
		GoogleModule
	],
	controllers: [ProjectController],
	providers: [
		ProjectService,
		BoardService,
		ListService,
		CardService,
	],
	exports: [ProjectService]
})
export class ProjectModule { }
