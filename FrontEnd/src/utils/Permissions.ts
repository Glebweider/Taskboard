import { EBoardMemberRole, EProjectMemberRole, IBoardMember, IProject } from "@Redux/reducers/projectReducer";


export const isOwnerOrManager = (
    project: any,
    userId: string
): boolean => {
    const userProjectRole = project?.members?.find((m: IBoardMember) => m.id === userId)?.role;

    return (
        project.ownerId == userId ||
        userProjectRole === EProjectMemberRole.MANAGER
    );
};

export const isBoardAdmin = (
    project: IProject,
    boardId: string,
    userId: string
): boolean => {
    const userBoardRole = project.boards
        ?.find(b => b.id === boardId)
        ?.members.find(m => m.id === userId)?.role;

    const userProjectRole = project.members
        ?.find(m => m.id === userId)?.role;

    return (
        userBoardRole === EBoardMemberRole.ADMIN ||
        userProjectRole === EProjectMemberRole.MANAGER
    );
};

export const isBoardUser = (
    project: IProject,
    boardId: string,
    userId: string
): boolean => {
    const userBoardRole = project.boards
        ?.find(b => b.id === boardId)
        ?.members.find(m => m.id === userId)?.role;

    const userProjectRole = project.members
        ?.find(m => m.id === userId)?.role;

    return (
        userBoardRole !== EBoardMemberRole.OBSERVER ||
        userProjectRole === EProjectMemberRole.MANAGER
    );
};
