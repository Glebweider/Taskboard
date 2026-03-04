// src/auth/dto/auth.dto.ts

// ! lib
// class-validator
import { IUser } from '@Interfaces/index';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class RegisterUserDto {
	@IsNotEmpty()
	@IsString()
	discordId: string;

	@IsNotEmpty()
	@IsString()
	username: string;

	@IsNotEmpty()
	@IsString()
	avatar: string;
}

export class IAuthDiscordDto {
	@IsString()
	token: string;

	@IsObject()
	user: IUser;
}
