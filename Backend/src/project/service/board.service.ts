// src/project/service/board.service.ts

// ! lib
// nestjs
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
// mongoose
import { Model } from 'mongoose';

// ! lib
// interface
import {
	IAuthorizedUserReq,
	IBoard,
	IBoardMember,
	IProject,
	EBoardMemberRole,
	EProjectActivityType
} from '@Interfaces';
import { ChangeBoardUserRolesDto, CreateBoardDto, UpdateBoardDto } from '../dto';
import { checkOwnershipOrManager } from '@Utils';
import { getBoard } from '../helpers';
import { BOARDS_LIMIT } from '@Constants';
import { SseService } from '@Sse/sse.service';
import { ActivityService } from '@Activity/activity.service';
import { RedisService } from '@Redis/redis.service';


@Injectable()
export class BoardService {
	constructor(
		@InjectModel('Project') private projectModel: Model<IProject>,
		private sseService: SseService,
		private activityService: ActivityService,
		private redisService: RedisService
	) { }

	async create(dto: CreateBoardDto, req: IAuthorizedUserReq) {
		const project = req.project;

		await checkOwnershipOrManager(req);
		if (project.boards.length >= BOARDS_LIMIT)
			throw new HttpException('Привышен лимит досок!', HttpStatus.BAD_REQUEST);

		const boardMembers: IBoardMember[] = project.members.map(member => ({
			id: member.id,
			role: member.id === project.ownerId ? EBoardMemberRole.ADMIN : EBoardMemberRole.OBSERVER
		}));

		const newBoard: IBoard = {
			id: uuidv4(),
			name: dto.name,
			members: boardMembers,
			lists: [],
			color: 0
		};

		project.boards.push(newBoard);
		await this.projectModel.updateOne(
			{ id: req.project.id },
			{ boards: project.boards },
		).lean();

		this.sseService.emit(project.id, {
			type: 'create',
			entity: 'board',
			payload: newBoard,
			path: `boards`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.BOARD_CREATED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: newBoard.id,
				boardTitle: newBoard.name,
				members: boardMembers
			},
		});

		return newBoard;
	}

	async update(dto: UpdateBoardDto, boardId: string, req: IAuthorizedUserReq): Promise<object> {
		const project = req.project;
		const board = await getBoard(req, boardId);

		await checkOwnershipOrManager(req);
		const setFields: Record<string, any> = {};

		if (dto.name !== undefined)
			setFields['boards.$[elem].name'] = dto.name;
		if (dto.color !== undefined)
			setFields['boards.$[elem].color'] = dto.color;

		if (Object.keys(setFields).length === 0) 
			throw new HttpException('Нету данных для обновленния', HttpStatus.BAD_REQUEST);

		await this.projectModel.updateOne(
			{ id: project.id },
			{ $set: setFields },
			{
				arrayFilters: [{ 'elem.id': boardId }],
			}
		);

		this.sseService.emit(project.id, {
			type: 'update',
			entity: 'board',
			payload: {
				name: dto.name,
				color: dto.color
			},
			path: `boards.${boardId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.BOARD_UPDATED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: board.id,
				boardOldTitle: board.name,
				boardNewTitle: dto.name,
				boardOldColor: board.color,
				boardNewColor: dto.color
			},
		});

		return {
			id: boardId,
			name: dto.name,
			color: dto.color
		};
	}

	async delete(boardId: string, req: IAuthorizedUserReq) {
		const project = req.project

		await checkOwnershipOrManager(req);
		const board = await getBoard(req, boardId);
		if (!board)
			throw new HttpException('Board не найден', HttpStatus.NOT_FOUND);

		await this.projectModel.updateOne(
			{ id: project.id },
			{ $pull: { boards: { id: boardId } } }
		);

		this.sseService.emit(project.id, {
			type: 'delete',
			entity: 'board',
			payload: null,
			path: `boards.${boardId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.BOARD_DELETED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: board.id,
				boardTitle: board.name,
			},
		});

		return;
	}

	async changeBoardUserRole(dto: ChangeBoardUserRolesDto, boardId: string, req: IAuthorizedUserReq) {
		const project = req.project;
		const userId = dto.discordId;
		const newRole = dto.role;

		if (project.ownerId == dto.discordId)
			throw new HttpException('Вы не можете изменить роль владельца!', HttpStatus.FORBIDDEN)

		const board = await getBoard(req, boardId);

		const member = board.members.find(member => member.id === userId);
		if (!member)
			throw new HttpException('Участник не найден.', HttpStatus.NOT_FOUND);

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$set: {
					'boards.$[board].members.$[member].role': newRole
				}
			},
			{
				arrayFilters: [
					{ 'board.id': boardId },
					{ 'member.id': userId }
				]
			}
		);

		this.sseService.emit(project.id, {
			type: 'change',
			entity: 'board',
			payload: {
				userId: userId,
				newRole: newRole
			},
			path: `boards.${boardId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.BOARD_ROLE_CHANGED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: board.id,
				boardTitle: board.name,
				member: member
			},
		});

		return;
	}
}
