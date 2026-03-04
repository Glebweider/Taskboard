// src/project/service/list.service.ts

// ! lib
// nestjs
import { HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
// mongoose
import { Model } from 'mongoose';

// ! lib
// interface
import { EProjectActivityType, IAuthorizedUserReq, IList, IProject } from '@Interfaces';
import { CreateListDto, MoveListDto, UpdateListDto } from '../dto';
import { SseService } from '@Sse/sse.service';
import { getBoard, getList } from '../helpers';
import { LISTS_LIMIT } from '@Constants';
import { ActivityService } from '@Activity/activity.service';
import { RedisService } from '@Redis/redis.service';


@Injectable()
export class ListService {
	constructor(
		@InjectModel('Project') private projectModel: Model<IProject>,
		private sseService: SseService,
		private activityService: ActivityService,
		private redisService: RedisService
	) { }

	async move(dto: MoveListDto, boardId: string, req: IAuthorizedUserReq) {
		const project = req.project;
		const board = await getBoard(req, boardId);
		if (!board) throw new HttpException('Доска не найдена', HttpStatus.NOT_FOUND);

		const listIndex = board.lists.findIndex(l => l.id === dto.listId);
		if (listIndex === -1) throw new HttpException('Список не найден', HttpStatus.NOT_FOUND);

		const rawTargetPos = Math.max(0, dto.moveToPosition);
		if (listIndex === rawTargetPos) {
			throw new HttpException('Список уже на этой позиции', HttpStatus.BAD_REQUEST);
		}

		try {
			const [list] = board.lists.splice(listIndex, 1);
			const clampedPosition = Math.min(rawTargetPos, board.lists.length);

			board.lists.splice(clampedPosition, 0, list);
			board.lists.forEach((l, idx) => (l.position = idx));

			await this.projectModel.updateOne(
				{ id: project.id, 'boards.id': boardId },
				{ $set: { 'boards.$.lists': board.lists } },
			);

			this.sseService.emit(project.id, {
				type: 'change',
				entity: 'list',
				payload: {
					listId: dto.listId,
					newPosition: clampedPosition
				},
				path: `boards.${boardId}.lists.${dto.listId}`
			});

			const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
			await this.activityService.log({
				projectId: project.id,
				type: EProjectActivityType.LIST_MOVED,
				actorId: req.user.discordId,
				actorName,
				payload: {
					oldPosition: listIndex,
					newPosition: clampedPosition,
					boardId,
					boardTitle: board.name,
					listId: list.id,
					listTitle: list.name
				}
			});
		} catch (err) {
			console.error('Error moving list:', err);
			throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		return;
	}

	async create(dto: CreateListDto, boardId: string, req: IAuthorizedUserReq) {
		const project = req.project;
		const board = await getBoard(req, boardId);

		if (board.lists.length >= LISTS_LIMIT)
			throw new HttpException('Превышен лимит списков!', HttpStatus.BAD_REQUEST);

		const newList: IList = {
			id: uuidv4(),
			position: board.lists.length,
			name: dto.name,
			cards: []
		};

		await this.projectModel.updateOne(
			{ id: project.id, 'boards.id': boardId },
			{ $push: { 'boards.$.lists': newList } }
		).lean();

		this.sseService.emit(project.id, {
			type: 'create',
			entity: 'list',
			payload: newList,
			path: `boards.${boardId}.lists`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.LIST_CREATED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: boardId,
				boardTitle: board.name,
				listId: newList.id,
				listTitle: newList.name,
			},
		});

		return;
	}

	async update(dto: UpdateListDto, boardId: string, listId: string, req: IAuthorizedUserReq) {
		const project = req.project;
		const board = await getBoard(req, boardId);
		const list = await getList(req, boardId, listId);

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$set: { 'boards.$[board].lists.$[list].name': dto.name }
			},
			{
				arrayFilters: [
					{ 'board.id': boardId },
					{ 'list.id': listId }
				]
			}
		);

		this.sseService.emit(project.id, {
			type: 'update',
			entity: 'list',
			payload: dto.name,
			path: `boards.${boardId}.lists.${listId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.LIST_UPDATED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: boardId,
				boardTitle: board.name,
				listId: list.id,
				listOldTitle: list.name,
				listNewTitle: dto.name
			},
		});

		return;
	}

	async delete(boardId: string, listId: string, req: IAuthorizedUserReq) {
		const project = req.project
		const board = await getBoard(req, boardId);
		const list = await getList(req, boardId, listId);

		await this.projectModel.updateOne(
			{ id: project.id, 'boards.id': boardId },
			{ $pull: { 'boards.$.lists': { id: listId } } }
		);

		this.sseService.emit(project.id, {
			type: 'delete',
			entity: 'list',
			payload: null,
			path: `boards.${boardId}.lists.${listId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		await this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.LIST_DELETED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: boardId,
				boardTitle: board.name,
				listId: list.id,
				listTitle: list.name,
			},
		});

		return;
	}
}
