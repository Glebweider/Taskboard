// src/auth/dto/jwt.dto.ts

// class-validator
import { IsString } from 'class-validator';

export class JwtDto {
	@IsString()
	readonly discordToken: string;

	@IsString()
	readonly discordId: string;
}
