// src/common/models/project.models.ts

// ! lib
// mongoose
import { Schema } from 'mongoose';
import {
	IBoard,
	IBoardMember,
	ICard, IList,
	IProject,
	IProjectUser,
	EBoardMemberRole,
	ECardStatus,
	EProjectMemberRole
} from '@Interfaces';
import { mongoQueryCounterPlugin } from '@Plugins';


const CardSchema = new Schema<ICard>({
	id: { type: String, required: true },
	title: { type: String, required: true },
	position: { type: Number, required: true },
	status: { type: String, enum: Object.values(ECardStatus), required: true },
	description: { type: String },
	dueDate: { type: Date, default: null },
	members: { type: [String], default: [] },
	createdAt: { type: Date, required: true },
}, { _id: false });

export interface IUserTask {
	id: string;
	title: string;
	dueDate: Date | null;
	members: {
		id: string;
		username: string;
		avatar?: string;
	}[];
	createdAt: Date;
	projectId: string;
	projectName: string;
	boardId: string;
	boardName: string;
}

const ListSchema = new Schema<IList>({
	id: { type: String, required: true },
	position: { type: Number, required: true },
	name: { type: String, required: true },
	cards: { type: [CardSchema], default: [] }
}, { _id: false });

const BoardMemberSchema = new Schema<IBoardMember>({
	id: { type: String, required: true },
	role: { type: String, enum: Object.values(EBoardMemberRole), required: true }
}, { _id: false });

const BoardSchema = new Schema<IBoard>({
	id: { type: String, required: true },
	name: { type: String, required: true },
	members: { type: [BoardMemberSchema], default: [] },
	lists: { type: [ListSchema], default: [] },
	color: { type: Number, required: true }
}, { _id: false });

const ProjectUserSchema = new Schema<IProjectUser>({
	id: { type: String, required: true },
	displayName: { type: String },
	description: { type: String },
	role: { type: String, enum: Object.values(EProjectMemberRole), required: true }
}, { _id: false });

export const ProjectSchema = new Schema<IProject>({
	id: { type: String, required: true },
	discordId: { type: String, required: false },
	name: { type: String, required: true },
	ownerId: { type: String, required: true },
	members: { type: [ProjectUserSchema], default: [] },
	boards: { type: [BoardSchema], default: [] },
	dateOfCreation: { type: Date, required: true },
	discordIntegration: {
		updateChannelId: { type: String, required: false },
		// summary: {
		// 	enabled: { type: Boolean, required: true },
		// 	time: { type: Date, required: true },
		// 	channelId: { type: String, required: true }
		// }
	},
}, {
	toJSON: {
		virtuals: true,
		versionKey: false,
		transform(doc, ret) {
			ret.id = ret.id || String(ret._id);
			delete ret._id;
		}
	}
});

ProjectSchema.plugin(mongoQueryCounterPlugin);
