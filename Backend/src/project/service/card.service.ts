// src/project/service/card.service.ts

// ! lib
// nestjs
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
// mongoose
import { Model } from 'mongoose';

// ! lib
// interface
import { ECardStatus, EProjectActivityType, IAuthorizedUserReq, ICard, IProject } from '@Interfaces';
import { CreateCardDto, MoveCardDto, UpdateCardDto } from '../dto';
import { getBoard, getList } from '../helpers';
import { TASKS_LIMIT } from '@Constants';
import { DiscordService } from '@Discord/discord.service';
import { SseService } from '@Sse/sse.service';
import { ActivityService } from '@Activity/activity.service';
import { RedisService } from '@Redis/redis.service';
import { GoogleService } from '@Google/google.service';


@Injectable()
export class CardService {
	constructor(
		@InjectModel('Project') private projectModel: Model<IProject>,
		private discordService: DiscordService,
		private sseService: SseService,
		private activityService: ActivityService,
		private redisService: RedisService,
		private googleService: GoogleService
	) { }

	async move(dto: MoveCardDto, boardId: string, listId: string, req: IAuthorizedUserReq) {
		const project = req.project;
		const board = await getBoard(req, boardId);
		const sourceList = await getList(req, boardId, listId);
		const card = sourceList.cards.find(c => c.id === dto.cardId);

		if (!card) throw new HttpException('Карточка не найдена', HttpStatus.NOT_FOUND);

		const rawTargetPos = dto.moveToPosition >= 0 ? dto.moveToPosition : 0;
		if (listId === dto.moveToList && card.position === rawTargetPos)
			throw new HttpException('Карточка уже на этой позиции', HttpStatus.BAD_REQUEST);

		const targetList = await getList(req, boardId, dto.moveToList);
		if (!targetList) throw new HttpException('Целевой список не найден', HttpStatus.NOT_FOUND);

		if (listId !== dto.moveToList && targetList.cards.length >= TASKS_LIMIT)
			throw new HttpException('Вы достигли лимита задач в списке!', HttpStatus.BAD_REQUEST);

		try {
			const bulkOps: any[] = [];

			if (listId === dto.moveToList) {
				const ordered = [...sourceList.cards].sort((a, b) => a.position - b.position);
				const currentIndex = ordered.findIndex(c => c.id === card.id);
				ordered.splice(currentIndex, 1);

				const clampedTarget = Math.max(0, Math.min(rawTargetPos, ordered.length));
				ordered.splice(clampedTarget, 0, card);

				const updates: { id: string; newPos: number }[] = [];
				ordered.forEach((c, idx) => {
					if (c.position !== idx) updates.push({ id: c.id, newPos: idx });
				});

				for (const u of updates) {
					bulkOps.push({
						updateOne: {
							filter: { id: project.id },
							update: {
								$set: {
									'boards.$[board].lists.$[list].cards.$[card].position': u.newPos
								}
							},
							arrayFilters: [
								{ 'board.id': boardId },
								{ 'list.id': listId },
								{ 'card.id': u.id }
							]
						}
					});
				}
			} else {
				const sourceOrdered = [...sourceList.cards].sort((a, b) => a.position - b.position).filter(c => c.id !== card.id);
				const clampedTarget = Math.max(0, Math.min(rawTargetPos, targetList.cards.length));
				const targetOrdered = [...targetList.cards].sort((a, b) => a.position - b.position);
				const cardCopy = { ...card };

				targetOrdered.splice(clampedTarget, 0, cardCopy);
				await this.projectModel.updateOne(
					{ id: project.id },
					{
						$pull: {
							'boards.$[board].lists.$[sourceList].cards': { id: card.id }
						}
					},
					{
						arrayFilters: [
							{ 'board.id': boardId },
							{ 'sourceList.id': listId }
						],
					}
				);

				await this.projectModel.updateOne(
					{ id: project.id },
					{
						$push: {
							'boards.$[board].lists.$[targetList].cards': {
								$each: [{ ...cardCopy, position: clampedTarget }],
								$position: clampedTarget
							}
						}
					},
					{
						arrayFilters: [
							{ 'board.id': boardId },
							{ 'targetList.id': dto.moveToList }
						],
					}
				);

				const sourceUpdates: { id: string; newPos: number }[] = [];
				sourceOrdered.forEach((c, idx) => {
					if (c.position !== idx) sourceUpdates.push({ id: c.id, newPos: idx });
				});

				const targetUpdates: { id: string; newPos: number }[] = [];
				targetOrdered.forEach((c, idx) => {
					if (c.id === card.id) {
						targetUpdates.push({ id: c.id, newPos: idx });
					} else if (c.position !== idx) {
						targetUpdates.push({ id: c.id, newPos: idx });
					}
				});

				for (const u of sourceUpdates) {
					bulkOps.push({
						updateOne: {
							filter: { id: project.id },
							update: { $set: { 'boards.$[board].lists.$[sourceList].cards.$[card].position': u.newPos } },
							arrayFilters: [
								{ 'board.id': boardId },
								{ 'sourceList.id': listId },
								{ 'card.id': u.id }
							]
						}
					});
				}

				for (const u of targetUpdates) {
					bulkOps.push({
						updateOne: {
							filter: { id: project.id },
							update: { $set: { 'boards.$[board].lists.$[targetList].cards.$[card].position': u.newPos } },
							arrayFilters: [
								{ 'board.id': boardId },
								{ 'targetList.id': dto.moveToList },
								{ 'card.id': u.id }
							]
						}
					});
				}
			}

			if (bulkOps.length > 0) {
				await this.projectModel.bulkWrite(bulkOps, { ordered: false });
			}

			this.sseService.emit(project.id, {
				type: 'change',
				entity: 'card',
				payload: {
					newListId: dto.moveToList,
					newPosition: rawTargetPos
				},
				path: `boards.${boardId}.lists.${listId}.cards.${card.id}`
			});

			const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
			await this.activityService.log({
				projectId: project.id,
				type: EProjectActivityType.CARD_MOVED,
				actorId: req.user.discordId,
				actorName,
				payload: {
					oldPosition: card.position,
					newPosition: rawTargetPos,
					boardId,
					boardTitle: board.name,
					fromListId: listId,
					fromListTitle: sourceList.name,
					toListId: dto.moveToList,
					toListTitle: targetList.name,
					cardId: card.id,
					cardTitle: card.title,
				},
			});
		} catch (err) {
			console.error('Error moving card:', err);
			throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		return;
	}

	async create(dto: CreateCardDto, boardId: string, listId: string, files: Express.Multer.File[], req: IAuthorizedUserReq) {
		const project = req.project;
		const board = await getBoard(req, boardId);
		const list = await getList(req, boardId, listId);

		if (list.cards.length >= TASKS_LIMIT)
			throw new HttpException('Вы достигли лимита задач!', HttpStatus.BAD_REQUEST);

		if (dto.assignedUsers?.length) {
			const membersSet = new Set(project.members.map(m => m.id));
			for (const userId of dto.assignedUsers) {
				if (!membersSet.has(userId))
					throw new HttpException(`Пользователь ${userId} не найден!`, HttpStatus.NOT_FOUND);
			}
		}

		const uploadedLinks: string[] = [];
		if (files?.length) {
			for (const file of files) {
				const uploadedFile = await this.googleService.uploadFile(
					file.buffer,
					file.originalname,
					file.mimetype
				);

				uploadedLinks.push(uploadedFile.publicUrl);
			}
		}

		const finalDescription = dto.description ? this.replaceBlobImages(dto.description, uploadedLinks) : '';

		const cardId = uuidv4()
		const newCard: ICard = {
			id: cardId,
			position: list.cards.length,
			title: dto.title,
			status: ECardStatus.NONE,
			description: finalDescription || '',
			members: dto.assignedUsers ?? [],
			dueDate: dto.dueDate
				? new Date(dto.dueDate)
				: null,
			createdAt: new Date(),
		};

		await this.projectModel.findOneAndUpdate(
			{ id: project.id },
			{
				$push: { 'boards.$[board].lists.$[list].cards': newCard }
			},
			{
				arrayFilters: [
					{ 'board.id': boardId },
					{ 'list.id': listId }
				]
			}
		);

		/*this.discordService.sendNotificationOnNewTask(
			project.discordIntegration.updateChannelId,
			createCardDto.title,
			project.boards.find(board => board.id === boardId).name
		);*/

		/*if (createCardDto.assignedUsers?.length)
			for (const userId of createCardDto.assignedUsers) {
				this.discordService.sendNotificationUserOnNewTask(
					userId,
					createCardDto.title,
					createCardDto.dueDate
				);
			}*/

		this.sseService.emit(project.id, {
			type: 'create',
			entity: 'card',
			payload: newCard,
			path: `boards.${boardId}.lists.${listId}.cards`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.CARD_CREATED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: boardId,
				boardTitle: board.name,
				listId: listId,
				listTitle: list.name,
				cardId: cardId,
				cardTitle: newCard.title,
				cardDescription: finalDescription,
				cardMembers: newCard.members,
				cardDueDate: dto.dueDate
			},
		});

		return {
			id: cardId,
			description: finalDescription
		};
	}

	async update(
		dto: UpdateCardDto,
		boardId: string,
		listId: string,
		cardId: string,
		files: Express.Multer.File[],
		req: IAuthorizedUserReq
	) {
		const project = req.project;
		const list = await getList(req, boardId, listId);
		const card = list.cards.find(card => card.id === cardId);

		if (!card)
			throw new HttpException('Card not found', HttpStatus.NOT_FOUND);

		const oldFileIds = this.extractFileIdsFromHtml(card.description);
		const newFileIds = this.extractFileIdsFromHtml(dto.description ?? '');
		const removedFileIds = [...oldFileIds].filter(id => !newFileIds.has(id));

		for (const fileId of removedFileIds) {
			await this.googleService.deleteFile(fileId);
		}

		const uploadedFiles: { fileId: string; url: string }[] = [];

		if (files?.length) {
			for (const file of files) {
				const uploaded = await this.googleService.uploadFile(
					file.buffer,
					file.originalname,
					file.mimetype
				);

				uploadedFiles.push({
					fileId: uploaded.id,
					url: uploaded.publicUrl,
				});
			}
		}

		let finalDescription = dto.description ?? card.description;
		for (const file of uploadedFiles) {
			finalDescription = finalDescription.replace(
				/<img[^>]+src="blob:[^"]+"[^>]*>/,
				match =>
					match.replace(
						/src="[^"]+"/,
						`src="${file.url}" data-file-id="${file.fileId}"`
					)
			);
		}

		card.title = dto.title ?? card.title;
		card.description = finalDescription;
		card.dueDate = dto.dueDate ?? card.dueDate;
		card.members = dto.assignedUsers ?? card.members;

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$set: {
					'boards.$[board].lists.$[list].cards.$[card]': card
				}
			},
			{
				arrayFilters: [
					{ 'board.id': boardId },
					{ 'list.id': listId },
					{ 'card.id': cardId }
				]
			}
		);

		this.sseService.emit(project.id, {
			type: 'update',
			entity: 'card',
			payload: card,
			path: `boards.${boardId}.lists.${listId}.cards.${cardId}`
		});

		return {
			description: finalDescription
		}
	}

	async delete(boardId: string, listId: string, cardId: string, req: IAuthorizedUserReq) {
		const project = req.project

		const board = await getBoard(req, boardId);
		const list = await getList(req, boardId, listId);

		const card = list.cards.find(c => c.id === cardId);
		if (!card)
			throw new HttpException('Карточка не найдена', HttpStatus.NOT_FOUND);

		const fileIdsToDelete: string[] = [];
		if (card.description) {
			const regex = /<img[^>]+src="[^"]*\/files\/([^"]+)"[^>]*>/g;
			let match;
			while ((match = regex.exec(card.description)) !== null) {
				fileIdsToDelete.push(match[1]);
			}
		}

		for (const fileId of fileIdsToDelete) {
			try {
				await this.googleService.deleteFile(fileId);
			} catch (e) {
				Logger.warn(`Не удалось удалить файл ${fileId}: ${e.message}`);
			}
		}

		await this.projectModel.updateOne(
			{ id: project.id },
			{
				$pull: {
					'boards.$[board].lists.$[list].cards': { id: cardId },
				},
			},
			{
				arrayFilters: [
					{ 'board.id': boardId },
					{ 'list.id': listId },
				],
			},
		);

		this.sseService.emit(project.id, {
			type: 'delete',
			entity: 'card',
			payload: null,
			path: `boards.${boardId}.lists.${listId}.cards.${cardId}`
		});

		const actorName = (await this.redisService.getUserCache(req.user.discordId))?.username ?? 'Unknown';
		this.activityService.log({
			projectId: project.id,
			type: EProjectActivityType.CARD_DELETED,
			actorId: req.user.discordId,
			actorName: actorName,
			payload: {
				boardId: boardId,
				boardTitle: board.name,
				listId: listId,
				listTitle: list.name,
				cardId: cardId,
				cardTitle: card.title,
			},
		});

		return;
	}

	replaceBlobImages(html: string, links: string[]) {
		let index = 0;

		return html.replace(
			/src="blob:[^"]+"/g,
			() => {
				const link = links[index++];
				return link ? `src="${link}"` : '';
			}
		);
	}

	extractFileIdsFromHtml(html: string): Set<string> {
		const regex = /<img[^>]+src="[^"]*\/files\/([^"]+)"[^>]*>/g;
		const ids = new Set<string>();

		let match;
		while ((match = regex.exec(html)) !== null) {
			ids.add(match[1]);
		}

		return ids;
	}
}
