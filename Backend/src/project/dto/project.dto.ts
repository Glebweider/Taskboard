// src/project/dto/project.dto.ts

// class-validator
import {
	IsEnum,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateIf,
} from 'class-validator';
import {
	PROJECT_NAME_MAX_LENGTH,
	PROJECT_NAME_MIN_LENGTH,
	PROJECT_USER_DESCRIPTION_MAX_LENGTH,
	PROJECT_USER_DESCRIPTION_MIN_LENGTH,
	PROJECT_USERNAME_MAX_LENGTH,
	PROJECT_USERNAME_MIN_LENGTH,
	UPDATE_CHANNEL_ID_MAX_LENGTH,
	UPDATE_CHANNEL_ID_MIN_LENGTH
} from '@Constants';
import { EProjectMemberRole } from '@Interfaces';


export class CreateProjectDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(PROJECT_NAME_MIN_LENGTH)
	@MaxLength(PROJECT_NAME_MAX_LENGTH)
	readonly name: string;
}

export class UpdateProjectDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(PROJECT_NAME_MIN_LENGTH)
	@MaxLength(PROJECT_NAME_MAX_LENGTH)
	readonly name: string;
}

export class CreateInviteDto {
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	boardId?: string;

	@IsOptional()
	@IsNotEmpty()
	@IsNumber()
	@IsIn([1, 5, 10, 25, 50])
	linkUsed?: number;
}

export class UpdateDiscordUpdateChannelDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(UPDATE_CHANNEL_ID_MIN_LENGTH)
	@MaxLength(UPDATE_CHANNEL_ID_MAX_LENGTH)
	readonly updateChannelId: string;
}

export class ChangeProjectUserRolesDto {
	@IsNotEmpty()
	@IsString()
	readonly discordId: string;

	@ValidateIf((o) => o.description !== undefined || o.displayName !== undefined || o.role !== undefined)
	@IsOptional()
	@IsString()
	@MinLength(PROJECT_USERNAME_MIN_LENGTH)
	@MaxLength(PROJECT_USERNAME_MAX_LENGTH)
	displayName?: string;

	@ValidateIf((o) => o.description !== undefined || o.displayName !== undefined || o.role !== undefined)
	@IsOptional()
	@IsString()
	@MinLength(PROJECT_USER_DESCRIPTION_MIN_LENGTH)
	@MaxLength(PROJECT_USER_DESCRIPTION_MAX_LENGTH)
	description?: string;

	@ValidateIf((o) => o.description !== undefined || o.displayName !== undefined || o.role !== undefined)
	@IsOptional()
	@IsEnum(EProjectMemberRole)
	role?: EProjectMemberRole;
}

export class KickUserDto {
	@IsNotEmpty()
	@IsString()
	readonly discordId: string;
}
