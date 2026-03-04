// src/project/dto/board.dto.ts

// class-validator
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';
import { EBoardMemberRole } from '@Interfaces';
import { BOARD_NAME_MIN_LENGTH, BOARD_NAME_MAX_LENGTH } from '@Constants';


export class CreateBoardDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(BOARD_NAME_MIN_LENGTH)
	@MaxLength(BOARD_NAME_MAX_LENGTH)
	readonly name: string;
}

export class UpdateBoardDto {
	@IsString()
	@IsOptional()
	@MinLength(BOARD_NAME_MIN_LENGTH)
	@MaxLength(BOARD_NAME_MAX_LENGTH)
	name?: string;

	@IsNumber()
	@IsOptional()
	color?: number;
}

export class ChangeBoardUserRolesDto {
	@IsNotEmpty()
	@IsString()
	readonly discordId: string;

	@IsNotEmpty()
	@IsEnum(EBoardMemberRole)
	readonly role: EBoardMemberRole;
}
