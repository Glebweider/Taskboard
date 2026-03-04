// src/project/service/project.service.ts

// ! lib
// nestjs
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
// mongoose
import { Model } from 'mongoose';

// ! lib
// interface
import {
	IAuthorizedUserReq,
	IBoard,
	IList,
	IProject,
	IUser,
	EBoardMemberRole,
	EProjectActivityType,
	EProjectMemberRole
} from '@Interfaces';
import {
	ChangeProjectUserRolesDto,
	CreateInviteDto,
	CreateProjectDto,
	KickUserDto,
	UpdateDiscordUpdateChannelDto,
	UpdateProjectDto
} from '../dto';
import { checkOwnership, checkOwnershipOrManager, populateProjectForClient } from '@Utils';
import { MEMBERS_LIMIT, PROJECTS_LIMIT } from '@Constants';
import { DiscordService } from '@Discord/discord.service';
import { RedisService } from '@Redis/redis.service';
import { SseService } from '@Sse/sse.service';
import { ActivityService } from '@Activity/activity.service';


@Injectable()
export class ProjectService {
	constructor(
		@InjectModel('Project') private projectModel: Model<IProject>,
		@InjectModel('User') private userModel: Model<IUser>,
		private redisService: RedisService,
		private discordService: DiscordService,
		private sseService: SseService,
		private activityService: ActivityService
	) { }

	// -------------------------
	// 1. Инвайты
	// -------------------------

	async createInvite(dto: CreateInviteDto, req: IAuthorizedUserReq): Promise<string> {
		await checkOwnershipOrManager(req);

		const id = uuidv4();
		await this.redisService.addInviteCache(id, req.project.id, dto.boardId, dto.linkUsed);

		const ownerName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: req.project.id,
			type: EProjectActivityType.PROJECT_INVITE_CREATED,
			actorId: req.user.discordId,
			actorName: ownerName,
			payload: {
				id,
				boardId: dto.boardId,
				linkUsed: dto.linkUsed,
			},
		});

		return `${process.env.CLIENT_HOST}/projects?inviteId=${id}&inviteName=${req.project.name}&projectId=${req.project.id}`;
	}

	async acceptInvite(inviteId: string, req: IAuthorizedUserReq): Promise<any> {
		const invite = await this.redisService.getInviteCache(inviteId);
		if (!invite)
			throw new HttpException('Инвайт не найден или истёк!', HttpStatus.NOT_FOUND);

		const project = await this.projectModel.findOne({ id: invite.projectId }).lean();
		if (!project)
			throw new HttpException('Проект не найден!', HttpStatus.NOT_FOUND);

		if (project.members.length >= MEMBERS_LIMIT)
			throw new HttpException(`Проект достиг лимита в ${MEMBERS_LIMIT} пользователей!`, HttpStatus.FORBIDDEN);

		const userId = req.user.discordId;
		if (project.members.some(m => m.id === userId))
			return;

		const [, user] = await Promise.all([
			project.discordId
				? this.discordService.getMember(project.discordId, userId)
				: Promise.resolve(''),
			this.redisService.getUserCache(userId)
		]);

		project.members.push({
			id: userId,
			displayName: "",
			description: "",
			role: EProjectMemberRole.USER
		});
		project.boards.forEach(board => {
			if (!board.members.some(m => m.id === userId)) {
				const role = invite.boardId && board.id === invite.boardId
					? EBoardMemberRole.NORMAL
					: EBoardMemberRole.OBSERVER;
				board.members.push({ id: userId, role });
			}
		});

		await Promise.all([
			this.projectModel.updateOne(
				{ id: project.id },
				{ members: project.members, boards: project.boards }
			),
			this.userModel.updateOne(
				{ discordId: userId },
				{ $addToSet: { projects: project.id } }
			),
			this.redisService.addProjectToUserCache(userId, project.id),
			this.redisService.handleInviteUsage(inviteId)
		].filter(Boolean));

		this.sseService.emit(project.id, {
			type: 'add',
			entity: 'project',
			payload: {
				user: {
					id: userId,
					name: user.username,
					avatar: user.avatar,
					displayName: "",
					description: "",
					role: EProjectMemberRole.USER,
					dateOfCreation: user.dateOfCreation
				},
				role: project.boards
					.find(b => b.id === invite.boardId)
					?.members.find(m => m.id === userId)?.role ?? '',
				boardId: invite.boardId ?? '',
			},
			path: 'project'
		});

		const joinedUserName = user?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.USER_JOINED,
			actorId: userId,
			actorName: joinedUserName,
			payload: {
				userId,
				username: joinedUserName,
				displayName: "",
				description: "",
				roleProject: EProjectMemberRole.USER,
				boardId: invite.boardId ?? null,
				roleBoard:
					project.boards
						.find(b => b.id === invite.boardId)
						?.members.find(m => m.id === userId)?.role
					?? EBoardMemberRole.OBSERVER,
			},
		});


		const boards = project.boards.map(board => {
			return { id: board.id, name: board.name, color: board.color }
		});

		return {
			id: project.id,
			name: project.name,
			boards: boards,
			ownerId: project.ownerId
		};
	}

	// -------------------------
	// 2. Интеграции
	// -------------------------

	async integrateDiscord(req: IAuthorizedUserReq): Promise<string> {
		const project = req.project;

		await checkOwnership(req);

		if (project.discordId)
			throw new HttpException('Дискрод уже интегрирован', HttpStatus.FORBIDDEN);

		await this.redisService.addToIntegrationQueue(req.user.discordId, project.id);

		return process.env.BOT_INVITE;
	}

	// -------------------------
	// 3. Просмотр проектов
	// -------------------------

	async getUserProjectsPreview(req: IAuthorizedUserReq): Promise<any[]> {
		const user = await this.redisService.getUserCache(req.user.discordId);

		if (!user || !user.projects || user.projects.length === 0) return [];

		const projects = await this.projectModel.find(
			{ id: { $in: user.projects } },
			'-_id id name boards ownerId'
		).lean();

		const projectsMap = projects.map(project => {
			const boards = project.boards.map(board => {
				return { id: board.id, name: board.name, color: board.color }
			});

			return {
				id: project.id,
				name: project.name,
				boards: boards,
				ownerId: project.ownerId
			};
		});

		return projectsMap;
	}

	async getUserProjectsFull(req: IAuthorizedUserReq): Promise<any[]> {
		const user = await this.redisService.getUserCache(req.user.discordId);

		if (!user || !user.projects || user.projects.length === 0) return [];

		const projects = await this.projectModel.find(
			{ id: { $in: user.projects } },
			'-_id id name ownerId dateOfCreation members boards'
		).lean();

		const projectsWithCounts = projects.map(project => {
			let cardsCount = 0;

			if (project.boards && Array.isArray(project.boards)) {
				project.boards.forEach((board: IBoard) => {
					if (board.lists && Array.isArray(board.lists)) {
						board.lists.forEach((list: IList) => {
							if (list.cards && Array.isArray(list.cards)) {
								cardsCount += list.cards.length;
							}
						});
					}
				});
			}

			return {
				id: project.id,
				name: project.name,
				ownerId: project.ownerId,
				dateOfCreation: project.dateOfCreation,
				membersCount: project.members.length,
				boardsCount: project.boards.length,
				cardsCount
			};
		});

		return projectsWithCounts;
	}

	// -------------------------
	// 4. Пользователи проекта
	// -------------------------

	async getProjectUsers(req: IAuthorizedUserReq): Promise<any[]> {
		const project = req.project;

		const users = await this.redisService.getUsersCache(project.members.map(m => m.id));
		const usersMap = new Map(users.map(u => [
			u.discordId,
			{
				id: u.discordId,
				name: u.username,
				avatar: u.avatar,
				displayName: project.members.find(m => m.id === u.discordId)?.displayName || '',
				dateOfCreation: u.dateOfCreation
			}
		]));

		return project.members.map(member => usersMap.get(member.id));
	}

	// -------------------------
	// 5. CRUD проекты
	// -------------------------

	async create(dto: CreateProjectDto, req: IAuthorizedUserReq): Promise<any> {
		const user = await this.redisService.getUserCache(req.user.discordId);
		if (user.projects.length >= PROJECTS_LIMIT)
			throw new HttpException('Привышен лимит проектов!', HttpStatus.BAD_REQUEST);

		const project = new this.projectModel({
			id: uuidv4(),
			discordId: '',
			name: dto.name,
			ownerId: req.user.discordId,
			members: [{
				id: req.user.discordId,
				displayName: '',
				description: '',
				role: EProjectMemberRole.MANAGER
			}],
			boards: [],
			dateOfCreation: new Date(),
			discordIntegration: {
				updateChannelId: '',
				// summary: {
				// 	enabled: false,
				// 	time: new Date(),
				// 	channelId: ''
				// }
			}
		});

		await project.save();
		await this.userModel.updateOne(
			{ discordId: user.discordId },
			{ $addToSet: { projects: project.id } }
		)

		await this.redisService.addProjectToUserCache(user.discordId, project.id);
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.PROJECT_CREATED,
			actorId: req.user.discordId,
			actorName: user.username,
			payload: {
				projectId: project.id,
				projectName: project.name,
			},
		});

		return populateProjectForClient(project, this.redisService);
	}

	async update(dto: UpdateProjectDto, req: IAuthorizedUserReq): Promise<any> {
		const project = req.project

		await checkOwnershipOrManager(req);
		await this.projectModel.updateOne(
			{ id: project.id },
			{ name: dto.name },
		);

		this.sseService.emit(project.id, {
			type: 'update',
			entity: 'project',
			payload: dto.name,
			path: `project`
		});

		const ownerName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.PROJECT_UPDATED,
			actorId: req.user.discordId,
			actorName: ownerName,
			payload: {
				field: 'name',
				oldValue: project.name,
				newValue: dto.name,
			},
		});

		return {
			id: project.id,
			name: dto.name,
		};
	}

	async delete(req: IAuthorizedUserReq) {
		const project = req.project

		await checkOwnership(req);
		await this.userModel.updateMany(
			{ projects: project.id },
			{ $pull: { projects: project.id } }
		);

		await this.projectModel.deleteOne({ id: project.id });
		await this.redisService.removeProjectFromUsersCache(project.members.map(m => m.id), project.id);

		this.sseService.emit(project.id, {
			type: 'delete',
			entity: 'project',
			payload: null,
			path: `project`
		});

		const ownerName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.PROJECT_DELETED,
			actorId: req.user.discordId,
			actorName: ownerName,
			payload: {
				projectId: project.id,
				projectName: project.name,
				membersCount: project.members.length,
				boardsCount: project.boards.length,
			},
		});

		return;
	}

	async changeProjectUserRole(dto: ChangeProjectUserRolesDto, req: IAuthorizedUserReq) {
		const project = req.project;
		const userId = dto.discordId;

		await checkOwnershipOrManager(req);

		if (project.ownerId == userId)
			throw new HttpException('Вы не можете изменить роль владельца!', HttpStatus.FORBIDDEN)

		if (dto.role && req.user.discordId !== project.ownerId)
			throw new HttpException('Только владелец проекта может изменять роли!', HttpStatus.FORBIDDEN);

		const member = project.members.find(m => m.id == userId);
		if (!member)
			throw new HttpException('Участник не найден.', HttpStatus.NOT_FOUND);

		const updateSet: Record<string, any> = {};
		if (dto.role !== undefined) {
			updateSet['members.$[member].role'] = dto.role;
		}

		if (dto.description !== undefined) {
			updateSet['members.$[member].description'] = dto.description;
		}

		if (dto.displayName !== undefined) {
			updateSet['members.$[member].displayName'] = dto.displayName;
		}

		if (Object.keys(updateSet).length === 0) return;
		await this.projectModel.updateOne(
			{ id: project.id },
			{ $set: updateSet },
			{
				arrayFilters: [
					{ 'member.id': userId }
				]
			}
		);

		const ssePayload: Record<string, any> = { userId };

		if (dto.role !== undefined) {
			ssePayload.role = dto.role;
		}

		if (dto.description !== undefined) {
			ssePayload.description = dto.description;
		}

		if (dto.displayName !== undefined) {
			ssePayload.displayName = dto.displayName;
		}

		this.sseService.emit(project.id, {
			type: 'change',
			entity: 'project',
			payload: ssePayload,
			path: `projects`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.PROJECT_MEMBER_UPDATED,
			actorId: req.user.discordId,
			actorName,
			payload: {
				memberId: userId,
				changes: {
					role: dto.role,
					description: dto.description,
					displayName: dto.displayName
				}
			}
		});

		return;
	}

	async leave(req: IAuthorizedUserReq) {
		const project = req.project;
		const userId = req.user.discordId;

		if (project.ownerId == userId)
			throw new HttpException('Вы не можете покинуть свой же проект', HttpStatus.BAD_REQUEST);

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$pull: {
					members: { id: userId },
					'boards.$[].members': { id: userId }
				}
			},
		);

		await this.userModel.updateOne(
			{ discordId: userId },
			{
				$pull: {
					projects: project.id
				}
			}
		);

		await this.redisService.removeProjectFromUserCache(userId, project.id);

		this.sseService.emit(project.id, {
			type: 'remove',
			entity: 'project',
			payload: userId,
			path: `project`
		});

		const ownerName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.USER_LEAVE,
			actorId: req.user.discordId,
			actorName: ownerName,
			payload: {},
		});

		return;
	}

	// -------------------------
	// 6. Управление участниками
	// -------------------------

	async kickProjectUser(dto: KickUserDto, req: IAuthorizedUserReq) {
		const project = req.project;
		const userId = dto.discordId;

		await checkOwnershipOrManager(req);
		if (userId == project.ownerId)
			throw new HttpException('Вы не можете выгнать владельца!', HttpStatus.FORBIDDEN);

		if (project.members.find(m => m.id == userId).role == EProjectMemberRole.MANAGER)
			if (req.user.discordId != project.ownerId)
				throw new HttpException('Вы не можете выгнать менаджера!', HttpStatus.FORBIDDEN);

		if (!project.members.find(member => member.id === userId))
			throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$pull: {
					members: { id: userId },
					'boards.$[].members': { id: userId }
				}
			},
		);

		await this.userModel.updateOne(
			{ discordId: userId },
			{
				$pull: {
					projects: project.id
				}
			}
		);

		await this.redisService.removeProjectFromUserCache(userId, project.id);

		this.sseService.emit(project.id, {
			type: 'remove',
			entity: 'project',
			payload: userId,
			path: `projects`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		const kickedUserName = (await this.redisService.getUserCache(userId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.USER_KICKED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				kickedUserId: userId,
				kickedUserName: kickedUserName,
			},
		});

		return;
	}

	async getProjectIfUserIsMember(uuid: string, projectId: string): Promise<IProject | null> {
		const project = await this.projectModel.findOne(
			{ id: projectId },
			'-_id -__v'
		).lean();
		if (!project) return null;

		return project.members.find(member => member.id === uuid) ? project : null;
	}

	async updateDiscordChannel(req: IAuthorizedUserReq, dto: UpdateDiscordUpdateChannelDto) {
		await checkOwnership(req);

		if (req.project.discordIntegration.updateChannelId == dto.updateChannelId)
			throw new HttpException('Вы не можете указать тот же updateChannelId!', HttpStatus.FORBIDDEN);

		await this.projectModel.updateOne(
			{ id: req.project.id },
			{
				discordIntegration: {
					updateChannelId: dto.updateChannelId
				}
			}
		);
	}
}
