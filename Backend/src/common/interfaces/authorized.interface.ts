import { JwtDto } from '@Auth/dto';
import { Request } from 'express';
import { IProject } from './project.interface';

export interface IAuthorizedUserReq extends Request {
	user: JwtDto;
	token: string;
	project: IProject;
}