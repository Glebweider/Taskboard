import { Document } from 'mongoose';

export interface IInvite extends Document {
    id: string;
    projectId: string;
    boardId?: string;
    linkUsed?: number;
    createdAt: Date;
}