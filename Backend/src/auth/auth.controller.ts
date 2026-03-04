// src/auth/auth.controller.ts

// ! lib
// nest
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Req,
	Res,
	UseGuards
} from '@nestjs/common';
// express
import { Response } from 'express';

// ! own
// interface
import { IAuthorizedUserReq } from '@Interfaces';
// auth
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) { }

	@Get('/discord/:token')
	@HttpCode(HttpStatus.OK)
	async authDiscord(
		@Param('token') token: string,
		@Res() res: Response,
	) {
		const answer = await this.authService.authDiscord(token);

		res.cookie('jwt', answer.token, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: 'none',
			secure: true
		});
		res.send(answer.user);
	}

	@Get('/')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async authUser(@Req() req: IAuthorizedUserReq) {
		return this.authService.authUser(req.token);
	}

	@Get('/check')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async checkUser() {
		return;
	}

	@Post('/logout')
	logout(@Res({ passthrough: true }) res: Response) {
		res.cookie('jwt', '', { maxAge: 0, httpOnly: true, path: '/' });
		return { message: 'Logged out' };
	}
}
