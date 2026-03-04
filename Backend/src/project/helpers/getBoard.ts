import { HttpException, HttpStatus } from '@nestjs/common';
import { IAuthorizedUserReq, IBoard } from '@Interfaces';

export async function getBoard(
    req: IAuthorizedUserReq,
    boardId: string,
): Promise<IBoard> {
    const board: IBoard = req.project.boards.find(board => board.id === boardId);
    if (!board)
        throw new HttpException('Доска не найдена!', HttpStatus.NOT_FOUND);

    return board;
}
