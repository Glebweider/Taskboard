// src/utils/project.utils.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { EProjectMemberRole, IAuthorizedUserReq, IProject } from '@Interfaces';
import { RedisService } from '@Redis/redis.service';

export async function checkOwnership(req: IAuthorizedUserReq) {
    if (req.user.discordId !== req.project.ownerId)
        throw new HttpException('Вы не являетесь владельцем проекта!', HttpStatus.FORBIDDEN);
};

export async function checkOwnershipOrManager(req: IAuthorizedUserReq) {
    const { user, project } = req;

    if (user.discordId === project.ownerId) return;

    const member = project.members.find(m => m.id === user.discordId);
    if (member.role === EProjectMemberRole.MANAGER) return;

    throw new HttpException('Недостаточно прав!', HttpStatus.FORBIDDEN);
};

export async function populateProjectForClient(
    project: IProject,
    redisService: RedisService
): Promise<any> {
    const users: any[] = [];

    for (const member of project.members) {
        const cachedUser = await redisService.getUserCache(member.id);
        if (cachedUser) {
            users.push({
                ...cachedUser,
                displayName: member.displayName
            });
        }
    }

    const usersMap = new Map(
        users.map(u => [
            u.discordId,
            {
                id: u.discordId,
                name: u.username,
                displayName: u.displayName,
                avatar: u.avatar
            }
        ])
    );

    const clientMembers = project.members.map(member => {
        const user = usersMap.get(member.id);

        if (!user) return null;

        return {
            ...user,
            displayName: member.displayName,
            description: member.description,
            role: member.role
        };
    }).filter(Boolean);

    return {
        id: project.id,
        discordId: project.discordId,
        name: project.name,
        ownerId: project.ownerId,
        members: clientMembers,
        boards: project.boards,
        dateOfCreation: project.dateOfCreation,
        discordIntegration: project.discordIntegration
    };
}
