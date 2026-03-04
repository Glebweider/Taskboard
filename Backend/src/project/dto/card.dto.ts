// src/project/dto/card.dto.ts

// class-validator
import {
	IsArray,
	IsDateString,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateIf
} from 'class-validator';
import {
	MOVE_TASK_ID_MAX_LENGTH,
	MOVE_TASK_ID_MIN_LENGTH,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	TASK_TITLE_MIN_LENGTH
} from '@Constants';


export class MoveCardDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(MOVE_TASK_ID_MIN_LENGTH)
	@MaxLength(MOVE_TASK_ID_MAX_LENGTH)
	readonly cardId: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(MOVE_TASK_ID_MIN_LENGTH)
	@MaxLength(MOVE_TASK_ID_MAX_LENGTH)
	readonly moveToList: string;

	@IsNotEmpty()
	@IsNumber()
	readonly moveToPosition: number;
}

export class CreateCardDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(TASK_TITLE_MIN_LENGTH)
	@MaxLength(TASK_TITLE_MAX_LENGTH)
	readonly title: string;

	@IsOptional()
	@IsString()
	@MaxLength(TASK_DESCRIPTION_MAX_LENGTH)
	description?: string;

	@IsOptional()
	@IsDateString()
	dueDate?: Date;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	assignedUsers?: string[];
}

export class UpdateCardDto {
	@ValidateIf((o) => o.description !== undefined || o.dueDate !== undefined || o.title !== undefined)
	@IsOptional()
	@IsString()
	@MinLength(TASK_TITLE_MIN_LENGTH)
	@MaxLength(TASK_TITLE_MAX_LENGTH)
	title?: string;

	@ValidateIf((o) => o.description !== undefined || o.dueDate !== undefined || o.title !== undefined)
	@IsOptional()
	@IsString()
	@MaxLength(TASK_DESCRIPTION_MAX_LENGTH)
	description?: string;

	@ValidateIf((o) => o.description !== undefined || o.dueDate !== undefined || o.title !== undefined)
	@IsOptional()
	@IsDateString()
	dueDate?: Date;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	assignedUsers?: string[];
}
