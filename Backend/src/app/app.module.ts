// src/app/app.module.ts

// ! lib
// nestjs
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

// ! own
// app
import { AppController } from './app.controller';
import { AppService } from './app.service';
// modules
import { getTracker } from '@Utils';
import { BlockMiddleware } from '@Middleware';
import { BannedSchema } from '@Models';
import { AuthModule } from '@Auth/auth.module';
import { UserModule } from '@User/user.module';
import { ProjectModule } from '@Project/project.module';
import { DDiscordModule } from '@Discord/discord.module';
import { RedisModule } from '@Redis/redis.module';
import { SseModule } from '@Sse/sse.module';
import { ActivityModule } from '@Activity/activity.module';
import { GoogleModule } from '@Google/google.module';


@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
			isGlobal: true
		}),
		ThrottlerModule.forRoot({
			getTracker: getTracker,
			throttlers: [
				{
					ttl: 60000,
					limit: 60,
					blockDuration: 120
				}
			],
			errorMessage: 'Превышен лимит запросов. Попробуйте снова позже.'
		}),
		MongooseModule.forRoot(process.env.DB_HOST),
		MongooseModule.forFeature([{ name: 'Banned', schema: BannedSchema }]),
		AuthModule,
		UserModule,
		DDiscordModule,
		ProjectModule,
		RedisModule,
		SseModule,
		ActivityModule,
		GoogleModule
	],
	controllers: [AppController],
	providers: [AppService,]
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(BlockMiddleware).forRoutes('*');
	}
}