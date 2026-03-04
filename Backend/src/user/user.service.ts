// src/user/user.service.ts

// ! lib
// nestjs
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// mongoose
import { Model } from 'mongoose';

// ! lib
// interface
import { IAuthorizedUserReq, IProject, IUser } from '@Interfaces';
import { RedisService } from '@Redis/redis.service';
import { IUserTask } from '@Models';

@Injectable()
export class UserService {
	constructor(
		@InjectModel('Project') private projectModel: Model<IProject>,
		@InjectModel('User') private userModel: Model<IUser>,
		private redisService: RedisService,
	) { }

	async getUserByDiscordId(id: string): Promise<IUser> {
		const user = await this.redisService.getUserCache(id);

		if (!user)
			throw new NotFoundException('User not found');

		return user;
	}

	async getAllTasksUser(req: IAuthorizedUserReq): Promise<IUserTask[]> {
		const userId = req.user.discordId;
		const user = await this.getUserByDiscordId(userId);

		if (!user?.projects?.length) return [];

		const pipeline = [
			{ $match: { id: { $in: user.projects } } },

			{ $unwind: "$boards" },
			{ $unwind: "$boards.lists" },

			{
				$project: {
					projectId: "$id",
					projectName: "$name",
					boardId: "$boards.id",
					boardName: "$boards.name",
					cards: {
						$filter: {
							input: "$boards.lists.cards",
							as: "card",
							cond: { $in: [userId, "$$card.members"] }
						}
					}
				}
			},

			{ $unwind: "$cards" },

			{
				$project: {
					id: "$cards.id",
					title: "$cards.title",
					dueDate: "$cards.dueDate",
					members: "$cards.members",
					createdAt: "$cards.createdAt",
					projectId: 1,
					projectName: 1,
					boardId: 1,
					boardName: 1
				}
			}
		];

		const rows = await this.projectModel
			.aggregate(pipeline)
			.allowDiskUse(true)
			.exec();

		if (!rows.length) return [];
		
		const memberIdSet = new Set<string>();
		for (const row of rows) {
			for (const m of row.members) memberIdSet.add(m);
		}

		const memberIds = [...memberIdSet];
		const cachedUsers = await this.redisService.getUsersCache(memberIds);
		const userMap = new Map<string, { id: string; username: string; avatar?: string }>();
		for (const u of cachedUsers) {
			userMap.set(u.discordId, {
				id: u.id ?? u.discordId,
				username: u.username ?? "Unknown",
				avatar: u.avatar ?? undefined
			});
		}

		return rows.map(row => ({
			id: row.id,
			title: row.title,
			dueDate: row.dueDate ?? null,
			createdAt: row.createdAt,
			projectId: row.projectId,
			projectName: row.projectName,
			boardId: row.boardId,
			boardName: row.boardName,
			members: row.members.map((id: string) =>
				userMap.get(id) ?? { id, username: "Unknown" }
			)
		}));
	}
}
