import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';

import styles from './BoardList.module.scss';
import { ECardStatus, ICard, IList, IProject } from '@Redux/reducers/projectReducer';
import TaskCard from '@Components/Cards/Task';
import TaskModal from '@Components/Modals/Task';
import { IUserState } from '@Redux/reducers/userReducer';
import { useAlert } from '@Components/Alert/context';
import ListMenu from '@Components/Menus/List';
import { TASKS_LIMIT } from '@Utils/constants';
import { isBoardAdmin, isBoardUser } from '@Utils';


interface BoardListProps {
    list: IList;
    boardId: string;
    projectState: IProject;
    userState: IUserState;
    setOpenModalCreateTask: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedListId: React.Dispatch<React.SetStateAction<string>>;
}

const BoardList: React.FC<BoardListProps> = ({
    list,
    boardId,
    projectState,
    userState,
    setOpenModalCreateTask,
    setSelectedListId,
}) => {
    const { showAlert } = useAlert();

    const [selectedTask, setSelectedTask] = useState<ICard>({
        id: '',
        title: '',
        position: 0,
        status: ECardStatus.NONE,
        description: '',
        members: [],
        dueDate: null,
        createdAt: '',
    });
    const [isOpenTask, setIsOpenTask] = useState<boolean>(false);
    const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
    const [isMoveList, setIsMoveList] = useState<boolean>(false);
    const [isMoveCard, setIsMoveCard] = useState<boolean>(false);

    const adminVerified = isBoardAdmin(projectState, boardId, userState.id);
    const userVerified = isBoardUser(projectState, boardId, userState.id);


    /** Drag Function */
    const [{ isDragging }, dragRef, preview] = useDrag({
        type: 'LIST',
        item: list,
        canDrag: adminVerified,
        collect: monitor => ({
            isDragging: monitor.isDragging()
        })
    }, [list]);

    /** Drop Functions */
    const [, dropListRef] = useDrop({
        accept: 'LIST',
        drop: (dragItem: IList) => {
            if (dragItem.id === list.id) return;
            moveList({
                list: dragItem,
                targetPosition: list.position
            });
        },
    });

    const [, dropCardRef] = useDrop({
        accept: 'TASK',
        drop: (dragItem: { task: ICard; listId: string; }) => {
            if (list.cards.length === 0) {
                moveCard({
                    task: dragItem.task,
                    targetListId: dragItem.listId,
                });
            }
        },
    });

    const moveList = async (item: { list: IList; targetPosition: number; }) => {
        if (isMoveList) return;

        setIsMoveList(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/boards/${boardId}/lists/move`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        listId: item.list.id,
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
            setIsMoveList(false);
        }
    };

    const moveCard = async (item: { task: ICard, targetListId: string }) => {
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
                        moveToList: list.id,
                        moveToPosition: 0
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
                ref={node => {
                    dragRef(dropListRef(node));
                    dropCardRef(node);
                }}
                className={styles.container}
                style={{ opacity: isDragging ? 0.4 : 1 }}>
                <div className={styles.containerData}>
                    <div className={styles.containerLeftData}>
                        <div style={{ position: 'relative' }}>
                            <ListMenu
                                isOpen={isOpenMenu}
                                project={projectState}
                                boardId={boardId}
                                list={list}
                                onClose={() => setIsOpenMenu(false)} />
                        </div>
                        {adminVerified &&
                            <img
                                className='settingsBtn'
                                onClick={() => setIsOpenMenu(true)}
                                src='./icons/Settings.svg' />
                        }
                        <span className={styles.name}>{list.name}</span>
                    </div>
                    <img className={adminVerified ? styles.drag : ''} src='./icons/Drag.svg' />
                </div>
                {list?.cards.length > 0 &&
                    <div className={styles.containerTasks}>
                        {list.cards
                            .slice()
                            .sort((a, b) => a.position - b.position)
                            .map(task => (
                                <TaskCard
                                    key={task.id}
                                    setSelectedTask={setSelectedTask}
                                    setIsOpenTask={setIsOpenTask}
                                    task={task}
                                    boardId={boardId}
                                    listId={list.id}
                                    projectState={projectState}
                                    userPermission={userVerified} />
                            ))
                        }
                    </div>
                }
                {(userVerified && list?.cards?.length < TASKS_LIMIT) &&
                    <div
                        onClick={() => {
                            setSelectedListId(list.id);
                            setOpenModalCreateTask(true);
                        }}
                        className={styles.addTaskToList}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <rect x={7} y={0} width={2.5} height={18} rx={2.25} fill="#222225" />
                            <rect x={18.75} y={7.75} width={2.5} height={18} rx={2.25} transform="rotate(90 18 6.75)" fill="#222225" />
                        </svg>
                        {/* SVG - Copy Paste, TODO: Move to SVG File */}
                    </div>
                }
            </div>

            {createPortal(
                <TaskModal
                    isOpen={isOpenTask}
                    onClose={() => setIsOpenTask(false)}
                    setSelectedTask={setSelectedTask}
                    projectId={projectState.id}
                    boardId={boardId}
                    listId={list.id}
                    projectState={projectState}
                    initialData={selectedTask}
                    userState={userState} />,
                document.body
            )}
        </>
    );
};

export default BoardList;
