import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';

import { IInvite, IUser } from '@Interfaces';


@Injectable()
export class RedisService implements OnModuleInit {
	private redis: Redis;
	constructor(
		@InjectModel('User') private userModel: Model<IUser>,
	) { }

	onModuleInit() {
		this.redis = new Redis(process.env.REDIS_URL);

		this.redis.on('connect', () => {
			Logger.log('Redis connected', 'RedisService');
			this.bootStrap();
		});

		this.redis.on('error', (error) => {
			Logger.error(`Redis connection error: ${error}`, 'RedisService');
		});

		this.redis.on('end', () => {
			Logger.error('Redis connection closed', 'RedisService');
		});

		this.redis.on('reconnecting', () => {
			Logger.log('Redis reconnecting...', 'RedisService');
		});
	}

	async bootStrap() {
		Logger.log('Init Cache...', 'RedisService');

		const keys = await this.redis.keys('user:*');
		const redisIds = keys.map(key => key.replace('user:', ''));
		
		const usersToCache = await this.userModel.find({
			discordId: { $nin: redisIds },
		}).exec();

		for (const user of usersToCache) {
			await this.addUserCache(user);
		}

		Logger.log(`Cache Initialized. ${usersToCache.length} users cached.`, 'RedisService');
	}

	async addInviteCache(id: string, projectId: string, boardId?: string, linkUsed?: number) {
		const value = JSON.stringify({
			projectId,
			...(boardId && { boardId }),
			...(linkUsed && { linkUsed }),
			createdAt: new Date()
		});

		await this.redis.set(`invite:${id}`, value, "EX", 900);
	};

	async getInviteCache(id: string): Promise<IInvite> {
		const cachedInvite = await this.redis.get(`invite:${id}`);
		return JSON.parse(cachedInvite);
	};

	async handleInviteUsage(inviteId: string) {
		const cached = await this.redis.get(`invite:${inviteId}`);
		if (!cached) return null;

		const invite: { projectId: string; boardId?: string; linkUsed?: number; createdAt: string } = JSON.parse(cached);

		if (invite.linkUsed === undefined) return null;

		const createdAt = new Date(invite.createdAt).getTime();
		const now = Date.now();
		const ttl = Math.max(0, 900_000 - (now - createdAt));

		if (invite.linkUsed > 1) {
			invite.linkUsed -= 1;
			await this.redis.set(`invite:${inviteId}`, JSON.stringify(invite), "PX", ttl);
		} else {
			await this.redis.del(`invite:${inviteId}`);
		}
	}

	async addToIntegrationQueue(ownerId: string, projectId: string) {
		const key = `queue:integrationDiscord:${ownerId}:${projectId}`;

		const exists = await this.redis.exists(key);
		if (exists) return;

		await this.redis.set(
			key,
			JSON.stringify({ ownerId, projectId }),
			'EX',
			900
		);
	}

	async getIntegrationByOwner(ownerId: string): Promise<{ ownerId: string, projectId: string }> {
		const keys = await this.redis.keys(`queue:integrationDiscord:${ownerId}:*`);
		if (keys.length === 0) return null;

		const data = await this.redis.get(keys[0]);
		if (!data) return null;

		return JSON.parse(data);
	}

	async removeIntegration(ownerId: string, projectId: string) {
		const key = `queue:integrationDiscord:${ownerId}:${projectId}`;
		await this.redis.del(key);
	}

	async addUserCache(user: IUser) {
		const redisKey = `user:${user.discordId}`;

		const cachedUser = await this.redis.get(redisKey);
		if (cachedUser) return;

		await this.redis.set(redisKey, JSON.stringify({
			discordId: user.discordId,
			username: user.username,
			dateOfCreation: user.dateOfCreation,
			avatar: user.avatar,
			projects: user.projects
		}));
	};

	async updateUserAvatarCache(discordId: string, newAvatar: string) {
		const redisKey = `user:${discordId}`;

		const cachedUser = await this.redis.get(redisKey);
		if (!cachedUser) return;

		const userData = JSON.parse(cachedUser);
		userData.avatar = newAvatar;

		await this.redis.set(redisKey, JSON.stringify(userData));
	};

	async getUsersCache(userIds: string[]): Promise<any[]> {
		const redisKeys = userIds.map(id => `user:${id}`);
		const cachedUsers = await this.redis.mget(redisKeys);

		return cachedUsers.map(user => user ? JSON.parse(user) : null);
	};

	async removeProjectFromUsersCache(userIds: string[], projectId: string): Promise<void> {
		const redisKeys = userIds.map(id => `user:${id}`);
		const cachedUsers = await this.redis.mget(redisKeys);

		const updatedUsers = cachedUsers.map((user, index) => {
			if (user) {
				const parsedUser = JSON.parse(user);
				parsedUser.projects = parsedUser.projects.filter((id: string) => id !== projectId);

				return [`user:${userIds[index]}`, JSON.stringify(parsedUser)];
			}

			return null;
		}).filter(updatedUser => updatedUser !== null);

		if (updatedUsers.length > 0) {
			await this.redis.mset(...updatedUsers.flat());
		}
	}

	async getUserCache(userId: string): Promise<IUser> {
		const redisKey = `user:${userId}`;

		const cachedUser = await this.redis.get(redisKey);
		if (cachedUser) return JSON.parse(cachedUser);

		const user = await this.userModel.findOne({ discordId: userId }).exec();
		if (!user) return null;

		await this.redis.set(redisKey, JSON.stringify({
			discordId: user.discordId,
			username: user.username,
			dateOfCreation: user.dateOfCreation,
			avatar: user.avatar,
			projects: user.projects
		}));

		return user;
	};

	async addProjectToUserCache(userId: string, projectId: string) {
		const redisKey = `user:${userId}`;
		const cachedUser = await this.redis.get(redisKey);

		if (cachedUser) {
			const user = JSON.parse(cachedUser);

			if (!user.projects.includes(projectId)) {
				user.projects.push(projectId);
				await this.redis.set(redisKey, JSON.stringify(user));
			}
		}
	}

	async removeProjectFromUserCache(userId: string, projectId: string) {
		const redisKey = `user:${userId}`;
		const cachedUser = await this.redis.get(redisKey);

		if (cachedUser) {
			const user = JSON.parse(cachedUser);

			user.projects = user.projects.filter(id => id !== projectId);
			await this.redis.set(redisKey, JSON.stringify(user));
		}
	}

	async getValue(key: string): Promise<any> {
		return this.redis.get(key);
	}

	async setValue(key: string, content: string) {
		await this.redis.set(key, content);
	}

	async deleteValue(key: string) {
		await this.redis.del(key);
	}

	async addValue(key: string, content: string) {
		await this.redis.set(key, content);
	}
}
