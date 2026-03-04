// src/user/user.controller.ts

// ! lib
// nestjs
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Req,
	Res,
	Sse,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { Response, } from 'express';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';

// ! own
import { ProjectService } from './service/project.service';
import { CardService } from './service/card.service';
import { ListService } from './service/list.service';
import { BoardService } from './service/board.service';
import {
	ChangeBoardUserRolesDto,
	ChangeProjectUserRolesDto,
	CreateBoardDto,
	CreateCardDto,
	CreateInviteDto,
	CreateListDto,
	CreateProjectDto,
	KickUserDto,
	MoveCardDto,
	MoveListDto,
	UpdateBoardDto,
	UpdateCardDto,
	UpdateListDto,
	UpdateProjectDto
} from './dto';
import { IAuthorizedUserReq, EBoardMemberRole } from '@Interfaces';
import { ProjectRoles } from '@Decorators';
import { TASK_FILE_LIMIT, TASK_FILE_MAX_SIZE } from '@Constants';
import { populateProjectForClient } from '@Utils';
import { ProjectGuard, ProjectRolesGuard } from './guards';
import { SseService } from '@Sse/sse.service';
import { RedisService } from '@Redis/redis.service';
import { AuthGuard } from '@Auth/auth.guard';


@Controller('projects')
export class ProjectController {
	constructor(
		private projectService: ProjectService,
		private boardService: BoardService,
		private listService: ListService,
		private cardService: CardService,
		private sseService: SseService,
		private redisService: RedisService
	) { }

	// -------------------------
	// 1. Проект
	// -------------------------

	@Sse('/:projectId/stream')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	streamProjects(@Param('projectId') projectId: string): Observable<any> {
		return this.sseService.subscribe(projectId);
	}

	@Post('/:projectId/invite')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	createInvite(
		@Body() dto: CreateInviteDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.projectService.createInvite(dto, req);
	}

	@Get('/invite/:inviteId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async acceptInvite(
		@Param('inviteId') inviteId: string,
		@Req() req: IAuthorizedUserReq,
		@Res() res: Response): Promise<object> {
		try {
			const project = await this.projectService.acceptInvite(inviteId, req);
			return res.json(project);
		} catch (error) {
			if (error instanceof HttpException)
				return res.status(error.getStatus()).json({ message: error.message });
			
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	@Post('/:projectId/kick')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	kickUser(
		@Body() dto: KickUserDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.projectService.kickProjectUser(dto, req);
	}

	/*@Get('/:projectId/integration/discord')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	integrationDiscord(@Req() req: IAuthorizedUserReq): object {
		return this.projectService.integrateDiscord(req);
	}*/

	@Get('/:projectId/users')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	getUsersByProjectId(@Req() req: IAuthorizedUserReq): object {
		return this.projectService.getProjectUsers(req);
	}

	// @Get('/:projectId/tasks')
	// @HttpCode(HttpStatus.OK)
	// @UseGuards(AuthGuard, ProjectGuard)
	// getTasksByProjectId(@Req() req: IAuthorizedUserReq): object {
	// 	return this.projectService.getUserTasks(req);
	// }

	@Get('/preview')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	getProjectsPreviewByUserId(@Req() req: IAuthorizedUserReq): object {
		return this.projectService.getUserProjectsPreview(req);
	}

	@Get('/')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	getProjects(@Req() req: IAuthorizedUserReq): object {
		return this.projectService.getUserProjectsFull(req);
	}

	@Get('/:projectId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	getProjectById(@Req() req: IAuthorizedUserReq): object {
		return populateProjectForClient(req.project, this.redisService);
	}

	@Post('/')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	createProject(
		@Body() dto: CreateProjectDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.projectService.create(dto, req);
	}

	@Put('/:projectId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	updateProject(
		@Body() dto: UpdateProjectDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.projectService.update(dto, req);
	}

	@Delete('/:projectId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	deleteProject(@Req() req: IAuthorizedUserReq): object {
		return this.projectService.delete(req);
	}

	@Post('/:projectId/change-user-roles')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	changeProjectUserRoles(
		@Body() dto: ChangeProjectUserRolesDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.projectService.changeProjectUserRole(dto, req);
	}

	@Post('/:projectId/leave')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	leaveProject(@Req() req: IAuthorizedUserReq) {
		return this.projectService.leave(req);
	}

	// -------------------------
	// 2. Боард
	// -------------------------

	@Post('/:projectId/boards')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	createBoard(
		@Body() dto: CreateBoardDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.boardService.create(dto, req);
	}

	@Put('/:projectId/boards/:boardId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	updateBoard(
		@Param('boardId') boardId: string,
		@Body() dto: UpdateBoardDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.boardService.update(dto, boardId, req);
	}

	@Delete('/:projectId/boards/:boardId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard)
	deleteBoard(
		@Param('boardId') boardId: string,
		@Req() req: IAuthorizedUserReq): object {
		return this.boardService.delete(boardId, req);
	}

	@Post('/:projectId/boards/:boardId/change-user-roles')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	changeBoardUserRoles(
		@Body() dto: ChangeBoardUserRolesDto,
		@Param('boardId') boardId: string,
		@Req() req: IAuthorizedUserReq): object {
		return this.boardService.changeBoardUserRole(dto, boardId, req);
	}

	// -------------------------
	// 3. Лист
	// -------------------------

	@Post('/:projectId/boards/:boardId/lists/')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN)
	createList(
		@Param('boardId') boardId: string,
		@Body() dto: CreateListDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.listService.create(dto, boardId, req);
	}

	@Post('/:projectId/boards/:boardId/lists/move')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN)
	moveList(
		@Param('boardId') boardId: string,
		@Body() dto: MoveListDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.listService.move(dto, boardId, req);
	}

	@Put('/:projectId/boards/:boardId/lists/:listId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN)
	updateList(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Body() dto: UpdateListDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.listService.update(dto, boardId, listId, req);
	}

	@Delete('/:projectId/boards/:boardId/lists/:listId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN)
	deleteList(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Req() req: IAuthorizedUserReq): object {
		return this.listService.delete(boardId, listId, req);
	}

	// -------------------------
	// 4. Карточки
	// -------------------------

	@Post('/:projectId/boards/:boardId/lists/:listId/cards/move')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN, EBoardMemberRole.NORMAL)
	moveCard(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Body() dto: MoveCardDto,
		@Req() req: IAuthorizedUserReq): object {
		return this.cardService.move(dto, boardId, listId, req);
	}

	@Post('/:projectId/boards/:boardId/lists/:listId/cards/')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN, EBoardMemberRole.NORMAL)
	@UseInterceptors(
		FilesInterceptor('files', TASK_FILE_LIMIT, {
			storage: multer.memoryStorage(),
			limits: { fileSize: TASK_FILE_MAX_SIZE },
		}),
	)
	createCard(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Body() dto: CreateCardDto,
		@UploadedFiles() files: Express.Multer.File[],
		@Req() req: IAuthorizedUserReq): object {
		return this.cardService.create(dto, boardId, listId, files, req);
	}

	@Put('/:projectId/boards/:boardId/lists/:listId/cards/:cardId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN, EBoardMemberRole.NORMAL)
	@UseInterceptors(
		FilesInterceptor('files', TASK_FILE_LIMIT, {
			storage: multer.memoryStorage(),
			limits: { fileSize: TASK_FILE_MAX_SIZE },
		}),
	)
	updateCard(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Param('cardId') cardId: string,
		@Body() dto: UpdateCardDto,
		@UploadedFiles() files: Express.Multer.File[],
		@Req() req: IAuthorizedUserReq): object {
		return this.cardService.update(dto, boardId, listId, cardId, files, req);
	}

	@Delete('/:projectId/boards/:boardId/lists/:listId/cards/:cardId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard, ProjectGuard, ProjectRolesGuard)
	@ProjectRoles(EBoardMemberRole.ADMIN, EBoardMemberRole.NORMAL)
	deleteCard(
		@Param('boardId') boardId: string,
		@Param('listId') listId: string,
		@Param('cardId') cardId: string,
		@Req() req: IAuthorizedUserReq): object {
		return this.cardService.delete(boardId, listId, cardId, req);
	}

	// -------------------------
	// 5. Проект
	// -------------------------

	// @Post('/:projectId/discord/update-channel')
	// @HttpCode(HttpStatus.OK)
	// @UseGuards(AuthGuard, ProjectGuard)
	// updateDiscordUpdateChannel(@Req() req: IAuthorizedUserReq, @Body() dto: UpdateDiscordUpdateChannelDto): object {
	// 	return this.projectService.updateDiscordChannel(req, dto);
	// }
}
