import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { ProjectService } from '../service/project.service';
import { Request } from 'express';


@Injectable()
export class ProjectGuard implements CanActivate {
	constructor(private projectService: ProjectService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request: Request = context.switchToHttp().getRequest();
		const user = request['user'];
		const projectId = request.params.projectId;

		if (!user) {
			Logger.error('User not found in request. Make sure AuthGuard is applied before ProjectGuard.', 'ProjectGuard');
			throw new UnauthorizedException('Access denied');
		}

		if (!projectId) {
			Logger.error('ProjectId not found in request params.', 'ProjectGuard');
			throw new UnauthorizedException('Access denied');
		}

		const project = await this.projectService.getProjectIfUserIsMember(user.discordId, projectId);

		if (!project) {
			Logger.warn(`User ${user.discordId} is not a member of project ${projectId} or project doesn't exist`, 'ProjectGuard');
			throw new UnauthorizedException('You are not a member of this project');
		}

		request['project'] = project;

		Logger.log(`User ${user.discordId} is a member of project ${projectId}`, 'ProjectGuard');

		return true;
	}
}
