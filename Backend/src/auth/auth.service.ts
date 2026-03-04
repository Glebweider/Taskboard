// src/auth/auth.service.ts

// ! lib
// nestjs
import {
	BadRequestException,
	HttpException,
	HttpStatus,
	Injectable
} from '@nestjs/common';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';

import { IUser } from '@Interfaces/index';
import { IAuthDiscordDto, JwtDto, RegisterUserDto } from './dto';
import { UserService } from '@User/user.service';
import { RedisService } from '@Redis/redis.service';

@Injectable()
export class AuthService {
	constructor(
		@InjectModel('User') private userModel: Model<IUser>,
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
		private redisService: RedisService
	) { }

	async createToken(dto: JwtDto): Promise<string> {
		return this.jwtService.signAsync(dto);
	}

	async verifyToken(token: string): Promise<JwtDto> {
		return this.jwtService.verifyAsync(token);
	}

	async register(dto: RegisterUserDto): Promise<IUser> {
		const user: IUser = await this.userModel.create(dto);
		await user.save();
		
		await this.redisService.addUserCache(user);

		return user;
	}

	async authDiscord(token: string): Promise<IAuthDiscordDto> {
		if (!token) throw new BadRequestException('Token is required');

		const responseUser = await axios
			.get('https://discord.com/api/users/@me', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			.catch(error => {
				throw new HttpException(
					`Ошибка от Discord API: ${error.response.data.message}`,
					error.response.status
				);
			});

		const user = responseUser.data;

		if (!user) throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);

		let ourUser: IUser = await this.userService
			.getUserByDiscordId(user.id)
			.catch(() =>
				this.register({
					discordId: user.id,
					username: user.username,
					avatar: user.avatar,
				} as RegisterUserDto)
			);

		if (ourUser.avatar != user.avatar) {
			await this.userModel.updateOne(
				{ discordId: user.id },
				{ avatar: user.avatar }
			);

			await this.redisService.updateUserAvatarCache(user.id, user.avatar);

			ourUser.avatar = user.avatar;
		}

		const newToken = await this.createToken({
			discordToken: token,
			discordId: ourUser.discordId,
		});

		return {
			token: newToken,
			user: ourUser
		};
	}

	async authUser(token: string): Promise<IUser> {
		if (!token) throw new BadRequestException('Token is required');

		const dataToken = await this.verifyToken(token);
		const user = await this.userService.getUserByDiscordId(dataToken.discordId);
		if (!user) throw new BadRequestException('User not found');

		return user;
	}
}
