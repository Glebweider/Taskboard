import { useEffect, useRef, useState } from 'react';

import style from './TaskModal.module.scss';
import { useAlert } from '@Components/Alert/context';
import CreateNewTaskUsers from '@Components/Modals/CreateNewTaskUsers';
import CreateNewTaskDate from '@Components/Modals/CreateNewTaskDate';
import { formatDateShort, getDueDateColor, isBoardUser } from '@Utils';
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH, TASK_TITLE_MIN_LENGTH } from '@Utils/constants';
import { ECardStatus, ICard, IProject } from '@Redux/reducers/projectReducer';
import { IUserState } from '@Redux/reducers/userReducer';
import Editor from '@Components/Editor';
import Users from '@Components/Users';


export type EditorFile = {
    id: string;
    file: File;
};

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    setSelectedTask?: React.Dispatch<React.SetStateAction<ICard>>;
    projectId: string;
    boardId: string;
    listId: string;
    initialData?: ICard;
    projectState: IProject;
    userState: IUserState;
}

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    setSelectedTask,
    projectId,
    boardId,
    listId,
    projectState,
    initialData,
    userState
}) => {
    const { showAlert } = useAlert();

    const [files, setFiles] = useState<EditorFile[]>([]);
    const [name, setName] = useState<string>(initialData?.title ?? '');
    const [description, setDescription] = useState<string>(initialData?.description ?? '');
    const [users, setUsers] = useState<string[]>(initialData?.members ?? []);
    const [date, setDate] = useState<Date | null>(initialData?.dueDate ? new Date(initialData.dueDate) : null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpenUsersMenu, setIsOpenUsersMenu] = useState<boolean>(false);
    const [isOpenDateMenu, setIsOpenDateMenu] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(initialData ? false : true);
    const [isUpdt, setIsUpdt] = useState<boolean>(false);
    const [isFocusDescription, setIsFocusDescription] = useState<boolean>(false);
    const [firstData, setFirstData] = useState<ICard | null>(null);

    const titleRef = useRef<HTMLInputElement | null>(null);

    const userVerified = isBoardUser(projectState, boardId, userState.id);


    useEffect(() => {
        if (!isOpen) {
            setIsUpdt(false);
            setFirstData(null);
            return;
        }

        const editing = initialData ? false : true;
        setIsEditing(editing);
        setName(initialData?.title ?? '');
        setDescription(initialData?.description ?? '');
        setUsers(initialData?.members ?? []);
        setDate(initialData?.dueDate ? new Date(initialData.dueDate) : null);

        if (!initialData && titleRef.current) {
            setTimeout(() => titleRef.current?.focus(), 0);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (isEditing) {
            setFirstData({
                id: firstData?.id || initialData?.id || '',
                position: firstData?.position || initialData?.position || 0,
                title: name,
                status: initialData?.status || ECardStatus.NONE,
                description,
                members: users,
                dueDate: date?.toISOString() || '',
                createdAt: initialData?.createdAt || ''
            });
        } else {
            setName(firstData?.title || '');
            setDescription(firstData?.description ?? '');
            setUsers(firstData?.members ?? []);
            setDate(firstData?.dueDate ? new Date(firstData?.dueDate) : null);
        }
    }, [isEditing]);

    const onSave = async () => {
        if (name.length > TASK_TITLE_MAX_LENGTH && name.length != TASK_TITLE_MIN_LENGTH) {
            showAlert(`Task name must be no more than ${TASK_TITLE_MAX_LENGTH} characters`);
            return;
        }

        if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
            showAlert(`Task description must be no more than ${TASK_DESCRIPTION_MAX_LENGTH} characters`);
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const isEditMode = Boolean(initialData?.id) || isUpdt;

            const url = `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${boardId}/lists/${listId}/cards`;
            const method = isEditMode ? 'PUT' : 'POST';

            const formData = new FormData();
            const title = name.length ? name : 'New task';
            formData.append('title', title);
            files.forEach((file) => {
                formData.append('files', file.file);
            });
            if (description)
                formData.append('description', description);
            if (date)
                formData.append('dueDate', date.toISOString());
            if (users?.length) {
                users.forEach(user => formData.append('assignedUsers[]', user));
            }

            const response = await fetch(
                isEditMode ? `${url}/${initialData?.id || firstData?.id}` : url,
                {
                    method,
                    credentials: 'include',
                    body: formData
                }
            );

            if (!response.ok) {
                const data = await response.json();
                showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                return;
            }

            let dataResp: any = null;
            if (!isEditMode) {
                dataResp = await response.json();
            }

            setDescription(dataResp?.description || description);
            setFirstData({
                id: dataResp?.id || initialData?.id || firstData?.id,
                title: title,
                position: initialData?.position || 0,
                status: initialData?.status || ECardStatus.NONE,
                description: dataResp?.description || description,
                members: users,
                dueDate: date?.toISOString() || '',
                createdAt: initialData?.createdAt || ''
            });

            setSelectedTask?.({
                id: dataResp?.id || initialData?.id,
                title: title,
                position: initialData?.position || 0,
                status: initialData?.status || ECardStatus.NONE,
                description: dataResp?.description || description,
                members: users,
                dueDate: date?.toISOString() || '',
                createdAt: initialData?.createdAt || ''
            });

            setFiles([]);
            setIsEditing(false);
            setIsUpdt(true);
        } catch (error) {
            showAlert(`Error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const onDelete = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${boardId}/lists/${listId}/cards/${initialData?.id || firstData?.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                return;
            }

            onClose();
        } catch (error) {
            showAlert(`Error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return <></>;

    return (
        <>
            <div className="modalOverlay"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                        setIsEditing(false);
                        setIsFocusDescription(false);
                    }
                }}>
                <div
                    className={style.modalContent}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsFocusDescription(false);
                    }}>
                    <div className={style.modalContentContainer}>
                        <div className={style.modalHeader}>
                            <div style={{ display: 'flex', maxHeight: 60, alignItems: 'center' }}>
                                <span className={`${style.circle} ${date ? style[getDueDateColor(date)] : style.disable}`} />
                                <div className={style.modalData}>
                                    <div className={style.modalInputFieldContainer}>
                                        {isEditing ?
                                            <input
                                                ref={titleRef}
                                                type="text"
                                                placeholder="Enter task name"
                                                value={name}
                                                maxLength={TASK_TITLE_MAX_LENGTH}
                                                onChange={(e) => setName(e.target.value)}
                                                className={style.inputField} />
                                            :
                                            <span
                                                className={`${style.inputField} ${userVerified ? 'cursorPtr' : ''}`}
                                                onClick={() => {
                                                    if (userVerified) {
                                                        setIsEditing(true);
                                                        setTimeout(() => {
                                                            titleRef.current?.focus();
                                                        }, 0);
                                                    }
                                                }}>
                                                {name}
                                            </span>
                                        }
                                    </div>
                                    {isEditing && <hr />}
                                </div>
                            </div>
                            <div className={style.rightModalData}>
                                {users.length > 0 ?
                                    <Users
                                        className={`${style.user} ${date ? style[getDueDateColor(date)] : style.disable} cursorPtr`}
                                        onClick={() => {
                                            if (userVerified)
                                                setIsOpenUsersMenu(true);
                                        }}
                                        task={{
                                            id: '',
                                            title: '',
                                            position: 0,
                                            status: ECardStatus.NONE,
                                            description: '',
                                            members: users,
                                            dueDate: null,
                                            createdAt: ''
                                        }}
                                        projectState={projectState} />
                                    :
                                    userVerified &&
                                    <img
                                        className="cursorPtr"
                                        onClick={() => setIsOpenUsersMenu(true)}
                                        src='./icons/Profile-User.svg' />
                                }
                                {date ?
                                    <span
                                        className={`${style.dueDate} 
                                            ${date ? style[getDueDateColor(date)] : style.disable} cursorPtr `}
                                        onClick={() => {
                                            if (userVerified)
                                                setIsOpenDateMenu(true);
                                        }}>
                                        {date ? formatDateShort(date) : 'no date set'}
                                    </span>
                                    :
                                    userVerified &&
                                    <img
                                        className="cursorPtr"
                                        onClick={() => setIsOpenDateMenu(true)}
                                        src='./icons/Calendar.svg' />
                                }
                                {((firstData?.id || initialData?.id) && userVerified) &&
                                    <svg
                                        className="cursorPtr"
                                        onClick={onDelete}
                                        width="15"
                                        height="18"
                                        viewBox="0 0 15 18"
                                        fill="none">
                                        <path d="M9.20454 0C9.54 0 9.81818 0.278183 9.81818 0.613638V1.63637H14.1136C14.4491 1.63637 14.7273 1.91455 14.7273 2.25001V2.6591C14.7273 2.99455 14.4491 3.27274 14.1136 3.27274H0.613636C0.45089 3.27274 0.294809 3.20809 0.17973 3.09301C0.0646507 2.97793 0 2.82185 0 2.6591V2.25001C0 1.91455 0.278182 1.63637 0.613636 1.63637H4.90909V0.613638C4.90909 0.278183 5.18727 0 5.52273 0H9.20454Z" fill="#EF869F" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M1.68562 4.90918C1.57392 4.90898 1.46336 4.93165 1.36075 4.97581C1.25814 5.01996 1.16566 5.08466 1.08901 5.16591C1.01235 5.24716 0.953151 5.34325 0.915045 5.44825C0.87694 5.55326 0.860739 5.66495 0.867441 5.77646L1.48926 15.701C1.52884 16.3247 1.80481 16.9098 2.26091 17.337C2.717 17.7642 3.31888 18.0014 3.9438 18.0001H10.7838C11.4087 18.0014 12.0106 17.7642 12.4667 17.337C12.9228 16.9098 13.1988 16.3247 13.2383 15.701L13.852 5.77646C13.8587 5.66495 13.8425 5.55326 13.8044 5.44825C13.7663 5.34325 13.7071 5.24716 13.6304 5.16591C13.5538 5.08466 13.4613 5.01996 13.3587 4.97581C13.2561 4.93165 13.1455 4.90898 13.0338 4.90918H1.6938H1.68562ZM6.54562 9.0001C6.54562 8.78311 6.45942 8.575 6.30598 8.42156C6.15254 8.26812 5.94444 8.18192 5.72744 8.18192C5.51045 8.18192 5.30234 8.26812 5.1489 8.42156C4.99546 8.575 4.90926 8.78311 4.90926 9.0001V13.9092C4.90926 14.1262 4.99546 14.3343 5.1489 14.4878C5.30234 14.6412 5.51045 14.7274 5.72744 14.7274C5.94444 14.7274 6.15254 14.6412 6.30598 14.4878C6.45942 14.3343 6.54562 14.1262 6.54562 13.9092V9.0001ZM9.00017 8.18192C9.21716 8.18192 9.42527 8.26812 9.57871 8.42156C9.73215 8.575 9.81835 8.78311 9.81835 9.0001V13.9092C9.81835 14.1262 9.73215 14.3343 9.57871 14.4878C9.42527 14.6412 9.21716 14.7274 9.00017 14.7274C8.78317 14.7274 8.57506 14.6412 8.42163 14.4878C8.26819 14.3343 8.18199 14.1262 8.18199 13.9092V9.0001C8.18199 8.78311 8.26819 8.575 8.42163 8.42156C8.57506 8.26812 8.78317 8.18192 9.00017 8.18192Z" fill="#EF869F" />
                                    </svg>
                                }
                            </div>
                        </div>
                        <span className={style.description}>Description</span>
                        {isEditing ?
                            <Editor
                                isDisabledCreateButton={isLoading}
                                setFiles={setFiles}
                                isFocusDescription={isFocusDescription}
                                description={description}
                                setDescription={setDescription}
                                onClose={() => {
                                    setIsEditing(false);
                                    if (!initialData)
                                        onClose();
                                }}
                                onCreate={onSave} />
                            :
                            <div
                                className={`${style.descriptionBox} ${userVerified && "cursorPtr"}`}
                                onMouseDown={(e) => {
                                    if (userVerified) {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setIsFocusDescription(true);
                                    }
                                }}>
                                <div
                                    className={style.taskContent}
                                    style={{
                                        minHeight: 120,
                                        maxHeight: 640,
                                        padding: "6px 18px",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: description }} />
                                <hr />
                            </div>
                        }
                    </div>
                </div>
            </div >
            <CreateNewTaskUsers
                isOpen={isOpenUsersMenu}
                onClose={() => setIsOpenUsersMenu(false)}
                onSave={async (newUsers) => {
                    if (!initialData?.id) return;

                    try {
                        const response = await fetch(
                            `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${boardId}/lists/${listId}/cards/${initialData?.id}`,
                            {
                                method: 'PUT',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    assignedUsers: newUsers,
                                })
                            }
                        );

                        if (!response.ok) {
                            const data = await response.json();
                            showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                            return;
                        }

                        setSelectedTask?.({
                            id: initialData?.id || '',
                            title: name,
                            position: initialData.position || 0,
                            status: initialData?.status || ECardStatus.NONE,
                            description,
                            members: newUsers,
                            dueDate: date?.toISOString() || '',
                            createdAt: initialData?.createdAt || ''
                        });
                    } catch (error) {
                        showAlert(`Error: ${error}`);
                    }
                }}
                boardId={boardId}
                selectedUsers={users}
                setSelectedUsers={setUsers} />

            <CreateNewTaskDate
                isOpen={isOpenDateMenu}
                onClose={() => setIsOpenDateMenu(false)}
                onSave={async (newDate) => {
                    if (!initialData?.id) return;

                    try {
                        const response = await fetch(
                            `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${boardId}/lists/${listId}/cards/${initialData?.id}`,
                            {
                                method: 'PUT',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dueDate: date
                                })
                            }
                        );

                        if (!response.ok) {
                            const data = await response.json();
                            showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                            return;
                        }

                        setSelectedTask?.({
                            id: initialData?.id || '',
                            position: initialData?.position,
                            title: name,
                            status: initialData?.status || ECardStatus.NONE,
                            description,
                            members: users,
                            dueDate: newDate?.toISOString() || '',
                            createdAt: initialData?.createdAt || ''
                        });
                    } catch (error) {
                        showAlert(`Error: ${error}`);
                    }
                }}
                selectedDate={date}
                setSelectedDate={setDate} />
        </>
    )
};

export default TaskModal;
