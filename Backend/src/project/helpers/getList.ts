import { HttpException, HttpStatus } from '@nestjs/common';
import { IAuthorizedUserReq, IList, IBoard } from '@Interfaces';
import { getBoard } from './getBoard';

export async function getList(
    req: IAuthorizedUserReq,
    boardId: string,
    listId: string,
): Promise<IList> {
    const board: IBoard = await getBoard(req, boardId);

    const list = board.lists.find(l => l.id === listId);
    if (!list) {
        throw new HttpException('Список не найден!', HttpStatus.NOT_FOUND);
    }

    return list;
}
