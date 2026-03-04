import { Document } from 'mongoose';

export interface IProject extends Document {
	id: string;               // ID проекта (uuid или другой внешний id)
	discordId: string;
	name: string;             // Название проекта
	ownerId: string;          // ID владельца
	members: IProjectUser[];  // ID пользователей, которые состоят в проекте
	boards: IBoard[];         // Доски внутри проекта
	dateOfCreation: Date;     // Дата создания проекта
	discordIntegration: IDiscordIntegration;
}

export interface IProjectUser {
	id: string;
	displayName: string;
	description: string;
	role: EProjectMemberRole;
}

export interface IBoard {
	id: string;
	name: string;
	members: IBoardMember[];
	lists: IList[];
	color: number; // index color
}

export interface IBoardMember {
	id: string;        // ID Пользователя
	role: EBoardMemberRole;  // Роль Пользователя
}

export interface IList {
	id: string;
	position: number;
	name: string;
	cards: ICard[];
}

export interface ICard {
	id: string;
	position: number;
	status: ECardStatus;
	title: string;
	description: string;
	members: string[];
	dueDate: Date | null;
	createdAt: Date;
}

export interface IDiscordIntegration {
	updateChannelId: string;
	// summary: {
	// 	enabled: boolean;
	// 	time: Date;
	// 	channelId: string;
	// }
}

/* Enums */
export enum EBoardMemberRole {
	ADMIN = 'Administrator',
	NORMAL = 'Performer',
	OBSERVER = 'Observer',
}

export enum EProjectMemberRole {
	MANAGER = 'Manager',
	USER = 'User',
}

export enum ECardStatus {
	NONE = 'none',
	COMPLETE = 'complete',
}
