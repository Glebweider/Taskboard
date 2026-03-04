// src/common/models/user.models.ts

// ! lib
// mongoose
import { Schema } from 'mongoose';
import { IUser } from '@Interfaces';
import { mongoQueryCounterPlugin } from '@Plugins';


export const UserSchema = new Schema<IUser>({
	dateOfCreation: { type: Date, default: Date.now },
	discordId: { type: String, required: true },
	username: { type: String, required: true },
	avatar: { type: String, required: true },
	projects: []
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

UserSchema.plugin(mongoQueryCounterPlugin);