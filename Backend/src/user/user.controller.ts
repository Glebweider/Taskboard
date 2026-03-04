// src/user/user.controller.ts

// ! lib
// nestjs
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Req,
	UseGuards,
} from '@nestjs/common';

// ! own
import { UserService } from './user.service';
import { AuthGuard } from '@Auth/auth.guard';
import { IAuthorizedUserReq } from '@Interfaces';

@Controller('user')
export class UserController {
	constructor(private userService: UserService) { }

	@Get('/my-tasks')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	getAllTasksUser(@Req() req: IAuthorizedUserReq): object {
		return this.userService.getAllTasksUser(req);
	}
}
