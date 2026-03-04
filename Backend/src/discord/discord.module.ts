import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectSchema } from '@Models';
import { RedisModule } from '@Redis/redis.module';
import { DiscordService } from './discord.service';
import { DiscordController } from './discord.controller';


@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Project', schema: ProjectSchema },
		]),
		DiscordModule.forRootAsync({
			useFactory: () => ({
				token: process.env.BOT_TOKEN,
				discordClientOptions: {
					intents: [
						GatewayIntentBits.Guilds, 
						GatewayIntentBits.GuildMessages, 
						GatewayIntentBits.GuildMembers
					]
				}
			})
		}),
		//RedisModule
	],
	providers: [DiscordService],
	controllers: [DiscordController],
	exports: [DiscordService]
})
export class DDiscordModule { }
