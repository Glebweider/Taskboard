import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PROJECT_ROLES_KEY } from '@Decorators';
import { EBoardMemberRole, EProjectMemberRole } from '@Interfaces';


@Injectable()
export class ProjectRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request['user'];
        const project = request['project'];
        const boardId = request.params.boardId;

        if (!project)
            throw new ForbiddenException('Проект не найден');
        
        const allowedRoles = this.reflector.getAllAndOverride<EBoardMemberRole[]>(PROJECT_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!allowedRoles || allowedRoles.length === 0) return true;

        const board = project.boards.find(b => b.id === boardId);
        if (!board)
            throw new NotFoundException('Доска не найдена');

        const member = board.members.find(m => m.id === user.discordId);
        if (!member)
            throw new NotFoundException('Пользователь не найден');

        let userRole: EBoardMemberRole;
        if (user.discordId === project.ownerId) {
            userRole = EBoardMemberRole.ADMIN;
        } else {
            userRole = member.role ?? EBoardMemberRole.OBSERVER;
        }

        if (!allowedRoles.includes(userRole) && project.members.find(m => m.id == user.discordId).role != EProjectMemberRole.MANAGER)
            throw new ForbiddenException('Недостаточно прав');

        return true;
    }
}
