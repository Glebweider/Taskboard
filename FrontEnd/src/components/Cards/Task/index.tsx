import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';

import style from './TaskCard.module.scss';
import Users from '@Components/Users';
import { ICard, IProject } from "@Redux/reducers/projectReducer";
import { formatDateLong, formatDateShort, getDueDateColor } from '@Utils';
import { useAlert } from '@Components/Alert/context';


interface TaskCardProps {
    task: ICard;
    listId: string;
    boardId: string;
    projectState: IProject;
    setIsOpenTask: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedTask: React.Dispatch<React.SetStateAction<ICard>>;
    userPermission: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    listId,
    boardId,
    projectState,
    setIsOpenTask,
    setSelectedTask,
    userPermission
}) => {
    const { showAlert } = useAlert();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMoveCard, setIsMoveCard] = useState<boolean>(false);

    const searchParams = new URLSearchParams(location.search);
    const openTaskId = searchParams.get('open');
    

    useEffect(() => {
        if (openTaskId && openTaskId === task.id) {
            setSelectedTask(task);
            setIsOpenTask(true);
            searchParams.delete('open');
            navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
        }
    }, [openTaskId]);

    /** Drag Function */
    const [{ isDragging }, dragRef, preview] = useDrag({
        type: 'TASK',
        item: { task, listId },
        canDrag: () => userPermission,
        collect: monitor => ({
            isDragging: monitor.isDragging()
        })
    }, [task, listId]);

    /** Drop Function */
    const [, dropRef] = useDrop({
        accept: 'TASK',
        drop: (dragItem: { task: ICard; listId: string; }) => {
            if (dragItem.task.id === task.id) return;
            moveCard({
                task: dragItem.task,
                targetListId: dragItem.listId,
                targetPosition: task.position
            });
        },
    });

    const moveCard = async (item: { task: ICard, targetListId: string, targetPosition: number; }) => {
        if (isMoveCard || !item.targetListId) return;

        setIsMoveCard(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/boards/${boardId}/lists/${item.targetListId}/cards/move`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cardId: item.task.id,
                        moveToList: listId,
                        moveToPosition: item.targetPosition
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                return;
            }
        } catch (error) {
            showAlert(`Fetch failed: ${error}`);
        } finally {
            setIsMoveCard(false);
        }
    };

    return (
        <>
            <DragPreviewImage connect={preview} src={''} />
            <div
                ref={node => dragRef(dropRef(node))}
                onClick={() => {
                    setSelectedTask(task);
                    setIsOpenTask(true);
                }}
                className={style.container}
                style={{ opacity: isDragging ? 0.4 : 1 }}>
                <div className={style.contentHeader}>
                    <span className={style.title}>{task.title}</span>
                </div>
                <div className={style.content}>
                    <span className={`${style.dueDate} ${task.dueDate ? style[getDueDateColor(task.dueDate)] : style.disable}`}>
                        {task.dueDate ? formatDateShort(task.dueDate) : 'no date set'}
                    </span>
                    <Users 
                        className={`${style.users} ${task.dueDate ? style[getDueDateColor(task.dueDate)] : style.disable}`}
                        task={task} 
                        projectState={projectState} />
                </div>
                <hr />
                <span className={style.createDate}>Created on {formatDateLong(task.createdAt)}</span>
            </div>
        </>
    );
};

export default TaskCard;
