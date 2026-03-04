// src/common/models/projectActivity.models.ts

// ! lib
// mongoose
import { Schema } from 'mongoose';
import { EProjectActivityType, IProjectActivity } from '@Interfaces';
import { mongoQueryCounterPlugin } from '@Plugins';


export const ProjectActivitySchema = new Schema<IProjectActivity>({
	projectId: {
		type: String,
		required: true,
		index: true,
	},
	type: {
		type: String,
		enum: Object.values(EProjectActivityType),
		required: true,
	},
	actorId: { type: String, required: true },
	actorName: { type: String, required: true },
	payload: {
		type: Schema.Types.Mixed,
		required: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: true,
	},
});

ProjectActivitySchema.plugin(mongoQueryCounterPlugin);
