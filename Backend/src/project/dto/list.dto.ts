// src/project/dto/list.dto.ts

// class-validator
import { IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { LIST_NAME_MAX_LENGTH, LIST_NAME_MIN_LENGTH, MOVE_TASK_ID_MAX_LENGTH, MOVE_TASK_ID_MIN_LENGTH } from '@Constants/index';


export class MoveListDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(MOVE_TASK_ID_MIN_LENGTH)
	@MaxLength(MOVE_TASK_ID_MAX_LENGTH)
	readonly listId: string;

	@IsNotEmpty()
	@IsNumber()
	readonly moveToPosition: number;
}

export class CreateListDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(LIST_NAME_MIN_LENGTH)
	@MaxLength(LIST_NAME_MAX_LENGTH)
	readonly name: string;
}

export class UpdateListDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(LIST_NAME_MIN_LENGTH)
	@MaxLength(LIST_NAME_MAX_LENGTH)
	readonly name: string;
}