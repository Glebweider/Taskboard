// src/common/models/banned.models.ts

import { Schema } from 'mongoose';
import { IBanned } from '@Interfaces';
import { mongoQueryCounterPlugin } from '@Plugins';


export const BannedSchema = new Schema<IBanned>({
	discordId: { type: String, required: true },
	ip: { type: String, required: true }
});

BannedSchema.plugin(mongoQueryCounterPlugin);
