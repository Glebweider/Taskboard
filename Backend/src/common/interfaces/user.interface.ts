import { Document } from 'mongoose';

export interface IUser extends Document {
    dateOfCreation: Date;
    discordId: string;
    username: string;
    avatar: string;
    projects: string[];   // ID Проектов 
}
