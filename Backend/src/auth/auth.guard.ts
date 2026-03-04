import {
	Injectable,
	CanActivate,
	ExecutionContext,
	Logger,
	UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const token = request.cookies?.jwt;

		if (!token) {
			Logger.warn('No auth token', 'AuthGuard');
			throw new UnauthorizedException();
		}

		const user = await this.authService.verifyToken(token);
		if (!user) {
			Logger.warn('Invalid token', 'AuthGuard');
			throw new UnauthorizedException();
		}

		request['user'] = user;
		request['token'] = token;
		return true;
	}
}
