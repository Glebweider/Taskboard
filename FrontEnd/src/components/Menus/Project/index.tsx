import { useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import style from './ProjectMenu.module.scss';
import { RootState } from '@Redux/store';
import { useAlert } from '@Components/Alert/context';
import UsersProjectModal from '@Components/Modals/UsersProject';
import CreateModal from '@Components/Modals/Create';
import DeleteModal, { ETypeDelete } from '@Components/Modals/Delete';
import { PROJECT_NAME_MAX_LENGTH } from '@Utils/constants';
import LeaveModal, { ETypeLeave } from '@Components/Modals/Leave';
import { IProjectPreviewCard } from '@Redux/reducers/projectsReducer';
import { isOwnerOrManager } from '@Utils';


enum EMenuState {
    None = "None",
    Users = "Users",
    Leave = "Leave",
    Delete = "Delete",
    Rename = "Rename",
}

interface ProjectMenuProps {
    isOpen: boolean;
    project: IProjectPreviewCard;
    onClose: () => void;
    setProjects: React.Dispatch<React.SetStateAction<IProjectPreviewCard[]>>;
}

const ProjectMenu: React.FC<ProjectMenuProps> = ({
    isOpen,
    project,
    onClose,
    setProjects
}) => {
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const userState = useSelector((state: RootState) => state.userReducer);
    const projectState = useSelector((state: RootState) => state.projectReducer);

    const [menuState, setMenuState] = useState<EMenuState | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const verified = isOwnerOrManager(projectState, userState.id);


    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    return (
        <>
            <div
                ref={menuRef}
                className={`${style.container} ${isOpen ? style.open : ''}`}>
                <div
                    onClick={() => setMenuState(EMenuState.Users)}
                    className={style.content}>
                    <img src='./icons/User-Add.svg' />
                    <span>Users</span>
                </div>
                {verified &&
                    <div
                        onClick={() => setMenuState(EMenuState.Rename)}
                        className={style.content}>
                        <img width={18} height={18} src='./icons/Edit.svg' />
                        <span>Rename</span>
                    </div>
                }
                {project.ownerId != userState.id ?
                    <div
                        onClick={() => setMenuState(EMenuState.Leave)}
                        className={`${style.warningContent} ${style.content}`}>
                        <svg width="15" height="18" viewBox="0 0 15 18" fill="none">
                            <path d="M9.20454 0C9.54 0 9.81818 0.278183 9.81818 0.613638V1.63637H14.1136C14.4491 1.63637 14.7273 1.91455 14.7273 2.25001V2.6591C14.7273 2.99455 14.4491 3.27274 14.1136 3.27274H0.613636C0.45089 3.27274 0.294809 3.20809 0.17973 3.09301C0.0646507 2.97793 0 2.82185 0 2.6591V2.25001C0 1.91455 0.278182 1.63637 0.613636 1.63637H4.90909V0.613638C4.90909 0.278183 5.18727 0 5.52273 0H9.20454Z" fill="#EF869F" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M1.68562 4.90918C1.57392 4.90898 1.46336 4.93165 1.36075 4.97581C1.25814 5.01996 1.16566 5.08466 1.08901 5.16591C1.01235 5.24716 0.953151 5.34325 0.915045 5.44825C0.87694 5.55326 0.860739 5.66495 0.867441 5.77646L1.48926 15.701C1.52884 16.3247 1.80481 16.9098 2.26091 17.337C2.717 17.7642 3.31888 18.0014 3.9438 18.0001H10.7838C11.4087 18.0014 12.0106 17.7642 12.4667 17.337C12.9228 16.9098 13.1988 16.3247 13.2383 15.701L13.852 5.77646C13.8587 5.66495 13.8425 5.55326 13.8044 5.44825C13.7663 5.34325 13.7071 5.24716 13.6304 5.16591C13.5538 5.08466 13.4613 5.01996 13.3587 4.97581C13.2561 4.93165 13.1455 4.90898 13.0338 4.90918H1.6938H1.68562ZM6.54562 9.0001C6.54562 8.78311 6.45942 8.575 6.30598 8.42156C6.15254 8.26812 5.94444 8.18192 5.72744 8.18192C5.51045 8.18192 5.30234 8.26812 5.1489 8.42156C4.99546 8.575 4.90926 8.78311 4.90926 9.0001V13.9092C4.90926 14.1262 4.99546 14.3343 5.1489 14.4878C5.30234 14.6412 5.51045 14.7274 5.72744 14.7274C5.94444 14.7274 6.15254 14.6412 6.30598 14.4878C6.45942 14.3343 6.54562 14.1262 6.54562 13.9092V9.0001ZM9.00017 8.18192C9.21716 8.18192 9.42527 8.26812 9.57871 8.42156C9.73215 8.575 9.81835 8.78311 9.81835 9.0001V13.9092C9.81835 14.1262 9.73215 14.3343 9.57871 14.4878C9.42527 14.6412 9.21716 14.7274 9.00017 14.7274C8.78317 14.7274 8.57506 14.6412 8.42163 14.4878C8.26819 14.3343 8.18199 14.1262 8.18199 13.9092V9.0001C8.18199 8.78311 8.26819 8.575 8.42163 8.42156C8.57506 8.26812 8.78317 8.18192 9.00017 8.18192Z" fill="#EF869F" />
                        </svg>
                        <span>Leave project</span>
                    </div>
                    :
                    <div
                        onClick={() => setMenuState(EMenuState.Delete)}
                        className={`${style.warningContent} ${style.content}`}>
                        <svg width="15" height="18" viewBox="0 0 15 18" fill="none">
                            <path d="M9.20454 0C9.54 0 9.81818 0.278183 9.81818 0.613638V1.63637H14.1136C14.4491 1.63637 14.7273 1.91455 14.7273 2.25001V2.6591C14.7273 2.99455 14.4491 3.27274 14.1136 3.27274H0.613636C0.45089 3.27274 0.294809 3.20809 0.17973 3.09301C0.0646507 2.97793 0 2.82185 0 2.6591V2.25001C0 1.91455 0.278182 1.63637 0.613636 1.63637H4.90909V0.613638C4.90909 0.278183 5.18727 0 5.52273 0H9.20454Z" fill="#EF869F" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M1.68562 4.90918C1.57392 4.90898 1.46336 4.93165 1.36075 4.97581C1.25814 5.01996 1.16566 5.08466 1.08901 5.16591C1.01235 5.24716 0.953151 5.34325 0.915045 5.44825C0.87694 5.55326 0.860739 5.66495 0.867441 5.77646L1.48926 15.701C1.52884 16.3247 1.80481 16.9098 2.26091 17.337C2.717 17.7642 3.31888 18.0014 3.9438 18.0001H10.7838C11.4087 18.0014 12.0106 17.7642 12.4667 17.337C12.9228 16.9098 13.1988 16.3247 13.2383 15.701L13.852 5.77646C13.8587 5.66495 13.8425 5.55326 13.8044 5.44825C13.7663 5.34325 13.7071 5.24716 13.6304 5.16591C13.5538 5.08466 13.4613 5.01996 13.3587 4.97581C13.2561 4.93165 13.1455 4.90898 13.0338 4.90918H1.6938H1.68562ZM6.54562 9.0001C6.54562 8.78311 6.45942 8.575 6.30598 8.42156C6.15254 8.26812 5.94444 8.18192 5.72744 8.18192C5.51045 8.18192 5.30234 8.26812 5.1489 8.42156C4.99546 8.575 4.90926 8.78311 4.90926 9.0001V13.9092C4.90926 14.1262 4.99546 14.3343 5.1489 14.4878C5.30234 14.6412 5.51045 14.7274 5.72744 14.7274C5.94444 14.7274 6.15254 14.6412 6.30598 14.4878C6.45942 14.3343 6.54562 14.1262 6.54562 13.9092V9.0001ZM9.00017 8.18192C9.21716 8.18192 9.42527 8.26812 9.57871 8.42156C9.73215 8.575 9.81835 8.78311 9.81835 9.0001V13.9092C9.81835 14.1262 9.73215 14.3343 9.57871 14.4878C9.42527 14.6412 9.21716 14.7274 9.00017 14.7274C8.78317 14.7274 8.57506 14.6412 8.42163 14.4878C8.26819 14.3343 8.18199 14.1262 8.18199 13.9092V9.0001C8.18199 8.78311 8.26819 8.575 8.42163 8.42156C8.57506 8.26812 8.78317 8.18192 9.00017 8.18192Z" fill="#EF869F" />
                        </svg>
                        <span>Delete project</span>
                    </div>
                }
            </div>

            <UsersProjectModal
                isOpen={menuState == EMenuState.Users}
                onClose={() => setMenuState(EMenuState.None)}
                projectTitle={project.name} />

            <CreateModal
                isOpen={menuState == EMenuState.Rename}
                onClose={() => setMenuState(EMenuState.None)}
                placholder={'Rename project:'}
                title={project.name}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                onSubmit={async (name) => {
                    const response = await fetch(
                        `${process.env.REACT_APP_BACKEND_URI}/projects/${project.id}`,
                        {
                            method: 'PUT',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: name,
                            })
                        }
                    );

                    const data = await response.json();
                    if (!response.ok) {
                        showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                        return;
                    }

                    setProjects(prev => prev.map(p => p.id === data.id ? { ...p, name: data.name } : p));
                }} />

            <LeaveModal
                isOpen={menuState == EMenuState.Leave}
                onClose={() => setMenuState(EMenuState.None)}
                type={ETypeLeave.LEAVEPROJECT}
                onSubmit={async () => {
                    const response = await fetch(
                        `${process.env.REACT_APP_BACKEND_URI}/projects/${project.id}/leave`,
                        {
                            method: 'POST',
                            credentials: 'include',
                        }
                    );

                    if (!response.ok) {
                        const data = await response.json();
                        showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                        return;
                    }

                    setProjects(prev => prev.filter(p => p.id !== project.id));
                }} />

            <DeleteModal
                isOpen={menuState == EMenuState.Delete}
                type={ETypeDelete.PROJECT}
                title={project.name}
                countClicks={3}
                onClose={() => setMenuState(EMenuState.None)}
                onSubmit={async () => {
                    const response = await fetch(
                        `${process.env.REACT_APP_BACKEND_URI}/projects/${project.id}`,
                        {
                            method: 'Delete',
                            credentials: 'include',
                        }
                    );

                    if (!response.ok) {
                        const data = await response.json();
                        showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                        return;
                    }

                    navigate('', { replace: true });
                    setProjects(prev => prev.filter(p => p.id !== project.id));
                }} />
        </>
    );
};

export default ProjectMenu;
