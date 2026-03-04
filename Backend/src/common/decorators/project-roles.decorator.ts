import { SetMetadata } from '@nestjs/common';
import { EBoardMemberRole } from '@Interfaces/index';

export const PROJECT_ROLES_KEY = 'project_roles';

export const ProjectRoles = (...roles: EBoardMemberRole[]) => SetMetadata(PROJECT_ROLES_KEY, roles);
