import { useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import React from 'react';

import style from './UserSettingsMenu.module.scss';
import { RootState } from '@Redux/store';
import { useAlert } from '@Components/Alert/context';
import { EBoardMemberRole, EProjectMemberRole, IUserProject } from '@Redux/reducers/projectReducer';
import { PROJECT_USER_DESCRIPTION_MAX_LENGTH, PROJECT_USERNAME_MAX_LENGTH } from '@Utils/constants';
import CustomButton from '@Components/Button';


interface UserSettingsMenuProps {
    isOpen: boolean;
    member: IUserProject;
    onClose: () => void;
}

const UserSettingsMenu: React.FC<UserSettingsMenuProps> = ({ isOpen, member, onClose }) => {
    const { showAlert } = useAlert();
    const MemberBoardRolesArray = Object.values(EBoardMemberRole);
    const MemberProjectRolesArray = Object.values(EProjectMemberRole);

    const menuRef = useRef<HTMLDivElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);

    const projectState = useSelector((state: RootState) => state.projectReducer);
    const user = projectState.members.find(m => m.id === member.id);

    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [selectedBoardName, setSelectedBoardName] = useState<string>('');
    const [selector, setSelector] = useState<'Project' | 'Board'>("Project");
    const [username, setUsername] = useState<string>(user?.displayName || user?.name || '');
    const [description, setDescription] = useState<string>(user?.description || '');
    const [selectedRoleBoard, setSelectedRoleBoard] = useState<EBoardMemberRole>(MemberBoardRolesArray[3]);
    const [selectedRoleProject, setSelectedRoleProject] = useState<EProjectMemberRole>(user?.role || MemberProjectRolesArray[1]);
    const [open, setOpen] = useState<boolean>(false);
    const [isChange, setIsChange] = useState<boolean>(false);
    const [isKickUser, setIsKickUser] = useState<boolean>(false);
    const [isShaking, setIsShaking] = useState<boolean>(false);


    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSelectedRoleBoard(MemberBoardRolesArray[3]);
            setSelector('Project');
            setUsername(user?.displayName || user?.name || '');
            setDescription(user?.description || '');
            setSelectedBoardName('');
            setSelectedBoardId('');
            setOpen(false);

            return;
        }

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose]);

    useEffect(() => {
        const board = projectState.boards.find(board => board.id === selectedBoardId);
        const memberRoleRaw = board?.members.find(boardMember => boardMember.id === member.id)?.role;

        if (memberRoleRaw)
            setSelectedRoleBoard(memberRoleRaw);
    }, [selectedBoardId]);

    const saveChangesBoard = async () => {
        if (isChange) return;

        try {
            setIsChange(true);

            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/boards/${selectedBoardId}/change-user-roles`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        discordId: member.id,
                        role: selectedRoleBoard
                    }),
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
            setIsChange(false);
        }
    };

    const saveChangesProject = async () => {
        if (isChange) return;

        try {
            setIsChange(true);

            const payload: any = { discordId: member.id };
            if (user?.displayName !== username && user?.name !== username)
                payload.displayName = username;
            if (user?.description !== description)
                payload.description = description;
            if (user?.role !== selectedRoleProject)
                payload.role = selectedRoleProject;

            if (Object.keys(payload).length === 1) return;
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/change-user-roles`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
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
            setIsChange(false);
        }
    };

    const kick = async () => {
        if (isKickUser) return;

        setIsKickUser(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/kick`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        discordId: member.id,
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                return;
            }

            onClose();
        } catch (error) {
            showAlert(`Fetch failed: ${error}`);
        } finally {
            setIsKickUser(false);
        }
    };

    const triggerShake = () => {
        setIsShaking(false);
        requestAnimationFrame(() => {
            setIsShaking(true);
        });
    };

    const hasUnsavedChanges = () => {
        if (selector === 'Project')
            return (
                username !== (user?.displayName || user?.name || '') ||
                description !== (user?.description || '') ||
                selectedRoleProject !== user?.role
            );

        if (selector === 'Board') {
            if (!selectedBoardId) return false;

            const board = projectState.boards.find(board => board.id === selectedBoardId);
            const memberRoleRaw = board?.members.find(boardMember => boardMember.id === member.id)?.role;

            if (!memberRoleRaw) return false;
            return memberRoleRaw !== selectedRoleBoard;
        }

        return false;
    };

    return (
        <div
            ref={menuRef}
            className={`${style.container} ${isOpen ? style.open : ''}`}>
            <div className={style.header}>
                <span>User’s settings</span>
                <svg
                    onClick={kick}
                    width="15"
                    height="18"
                    viewBox="0 0 15 18"
                    fill="none">
                    <path d="M9.20454 0C9.54 0 9.81818 0.278183 9.81818 0.613638V1.63637H14.1136C14.4491 1.63637 14.7273 1.91455 14.7273 2.25001V2.6591C14.7273 2.99455 14.4491 3.27274 14.1136 3.27274H0.613636C0.45089 3.27274 0.294809 3.20809 0.17973 3.09301C0.0646507 2.97793 0 2.82185 0 2.6591V2.25001C0 1.91455 0.278182 1.63637 0.613636 1.63637H4.90909V0.613638C4.90909 0.278183 5.18727 0 5.52273 0H9.20454Z" fill="#EF869F" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M1.68562 4.90918C1.57392 4.90898 1.46336 4.93165 1.36075 4.97581C1.25814 5.01996 1.16566 5.08466 1.08901 5.16591C1.01235 5.24716 0.953151 5.34325 0.915045 5.44825C0.87694 5.55326 0.860739 5.66495 0.867441 5.77646L1.48926 15.701C1.52884 16.3247 1.80481 16.9098 2.26091 17.337C2.717 17.7642 3.31888 18.0014 3.9438 18.0001H10.7838C11.4087 18.0014 12.0106 17.7642 12.4667 17.337C12.9228 16.9098 13.1988 16.3247 13.2383 15.701L13.852 5.77646C13.8587 5.66495 13.8425 5.55326 13.8044 5.44825C13.7663 5.34325 13.7071 5.24716 13.6304 5.16591C13.5538 5.08466 13.4613 5.01996 13.3587 4.97581C13.2561 4.93165 13.1455 4.90898 13.0338 4.90918H1.6938H1.68562ZM6.54562 9.0001C6.54562 8.78311 6.45942 8.575 6.30598 8.42156C6.15254 8.26812 5.94444 8.18192 5.72744 8.18192C5.51045 8.18192 5.30234 8.26812 5.1489 8.42156C4.99546 8.575 4.90926 8.78311 4.90926 9.0001V13.9092C4.90926 14.1262 4.99546 14.3343 5.1489 14.4878C5.30234 14.6412 5.51045 14.7274 5.72744 14.7274C5.94444 14.7274 6.15254 14.6412 6.30598 14.4878C6.45942 14.3343 6.54562 14.1262 6.54562 13.9092V9.0001ZM9.00017 8.18192C9.21716 8.18192 9.42527 8.26812 9.57871 8.42156C9.73215 8.575 9.81835 8.78311 9.81835 9.0001V13.9092C9.81835 14.1262 9.73215 14.3343 9.57871 14.4878C9.42527 14.6412 9.21716 14.7274 9.00017 14.7274C8.78317 14.7274 8.57506 14.6412 8.42163 14.4878C8.26819 14.3343 8.18199 14.1262 8.18199 13.9092V9.0001C8.18199 8.78311 8.26819 8.575 8.42163 8.42156C8.57506 8.26812 8.78317 8.18192 9.00017 8.18192Z" fill="#EF869F" />
                </svg>
            </div>
            <hr />
            <div className={style.selectorContainerWrapper}>
                <div className={style.selectorContainer}>
                    <div className={style.labels}>
                        <span
                            className={selector === "Project" ? style.active : ""}
                            onClick={() => {
                                if (hasUnsavedChanges()) {
                                    triggerShake();
                                    return;
                                }
                                setSelector("Project");
                            }}>
                            Project
                        </span>
                        <span
                            className={selector === "Board" ? style.active : ""}
                            onClick={() => {
                                if (hasUnsavedChanges()) {

                                    triggerShake();
                                    return;
                                }
                                setSelector("Board");
                                setSelectedBoardId('');
                                setSelectedBoardName('');
                                setSelectedRoleBoard(MemberBoardRolesArray[3]);
                            }}>
                            Board
                        </span>
                    </div>
                    <div className={style.line}>
                        <span
                            className={style.selector}
                            style={{ transform: selector === "Project" ? "translateX(0%)" : "translateX(100%)" }} />
                    </div>
                </div>
            </div>
            {selector === "Board" ?
                <>
                    <div className={style.wrapper} ref={selectorRef} onClick={() => setOpen(!open)}>
                        <svg
                            className={style.icon}
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none">
                            <path d="M4.92169 11.8124C4.72169 11.8124 4.53598 11.6999 4.44312 11.5049C4.30741 11.2274 4.41455 10.8899 4.68598 10.7474C5.30741 10.4249 5.83598 9.9299 6.21455 9.3299C6.34312 9.1274 6.34312 8.8724 6.21455 8.6699C5.82884 8.0699 5.30026 7.5749 4.68598 7.2524C4.41455 7.1174 4.30741 6.7799 4.44312 6.4949C4.57169 6.2174 4.89312 6.1049 5.15741 6.2474C5.94312 6.6599 6.61455 7.2824 7.10026 8.0474C7.46455 8.6249 7.46455 9.3749 7.10026 9.9524C6.61455 10.7174 5.94312 11.3399 5.15741 11.7524C5.08598 11.7899 5.00026 11.8124 4.92169 11.8124Z" fill="#D4D4D4" />
                            <path d="M12.1431 11.8125H9.28596C8.9931 11.8125 8.75024 11.5575 8.75024 11.25C8.75024 10.9425 8.9931 10.6875 9.28596 10.6875H12.1431C12.436 10.6875 12.6788 10.9425 12.6788 11.25C12.6788 11.5575 12.436 11.8125 12.1431 11.8125Z" fill="#D4D4D4" />
                            <path d="M10.7146 17.0625H6.4289C2.55033 17.0625 0.893188 15.3225 0.893188 11.25V6.75C0.893188 2.6775 2.55033 0.9375 6.4289 0.9375H10.7146C14.5932 0.9375 16.2503 2.6775 16.2503 6.75V11.25C16.2503 15.3225 14.5932 17.0625 10.7146 17.0625ZM6.4289 2.0625C3.13605 2.0625 1.96462 3.2925 1.96462 6.75V11.25C1.96462 14.7075 3.13605 15.9375 6.4289 15.9375H10.7146C14.0075 15.9375 15.1789 14.7075 15.1789 11.25V6.75C15.1789 3.2925 14.0075 2.0625 10.7146 2.0625H6.4289Z" fill="#D4D4D4" />
                        </svg>
                        <div className={style.label}>
                            {selectedBoardName || "Select board"}
                        </div>
                        <svg
                            className={`${style.arrow} ${open ? style.active : ''}`}
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none">
                            <path d="M9.0606 0H4.69118H0.756598C0.0833007 0 -0.253348 0.87 0.223571 1.38L3.85657 5.265C4.43869 5.8875 5.38552 5.8875 5.96764 5.265L7.3493 3.7875L9.60064 1.38C10.0705 0.87 9.7339 0 9.0606 0Z" fill="#D4D4D4" />
                        </svg>
                        {open && (
                            <div className={style.dropdown}>
                                {projectState.boards.map((board) => (
                                    <div
                                        key={board.id}
                                        className={style.item}
                                        onClick={() => {
                                            setSelectedBoardName(board.name);
                                            setSelectedBoardId(board.id);
                                            setOpen(false);
                                        }}>
                                        <span />
                                        {board.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className={style.warningText}>
                        In this field, you can select the board in which to assign a role to the selected user.
                    </span>
                    <div className={style.containerRoles}>
                        <div className={style.contentRole}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M8.57143 9C10.5439 9 12.1429 7.32107 12.1429 5.25C12.1429 3.17893 10.5439 1.5 8.57143 1.5C6.59898 1.5 5 3.17893 5 5.25C5 7.32107 6.59898 9 8.57143 9Z" stroke="#D4D4D4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.7211 11.805L11.1925 14.46C11.0925 14.565 10.9996 14.76 10.9782 14.9025L10.8425 15.915C10.7925 16.2825 11.0353 16.5375 11.3853 16.485L12.3496 16.3425C12.4853 16.32 12.6782 16.2225 12.771 16.1175L15.2996 13.4625C15.7353 13.005 15.9425 12.4725 15.2996 11.7975C14.6639 11.13 14.1568 11.3475 13.7211 11.805Z" stroke="#D4D4D4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.3574 12.1875C13.5717 12.9975 14.1717 13.6275 14.9431 13.8525" stroke="#D4D4D4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.43555 16.5C2.43555 13.5975 5.18557 11.25 8.57128 11.25C9.31414 11.25 10.0284 11.3625 10.6927 11.5725" stroke="#D4D4D4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Select role</span>
                        </div>
                        <div className={style.roles}>
                            {MemberBoardRolesArray.map(role => (
                                <button
                                    key={role}
                                    disabled={!selectedBoardId}
                                    onClick={() => setSelectedRoleBoard(role)}
                                    className={`${style.role} ${selectedRoleBoard === role ? style.active : ''}`}>
                                    <span>{role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <hr />
                    <div className={style.buttons}>
                        <CustomButton
                            type={'Cancel'}
                            onClick={() => { onClose(); setSelectedBoardId(''); }} />
                        <CustomButton
                            type={'Asign'}
                            disabled={!selectedBoardId}
                            className={isShaking ? style.shake : ''}
                            onClick={saveChangesBoard} />
                    </div>
                </>
                :
                <>
                    <div className={style.modalInputFieldContainer}>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            maxLength={PROJECT_USERNAME_MAX_LENGTH}
                            onChange={(e) => setUsername(e.target.value)}
                            className={style.inputField} />
                    </div>
                    <div className={style.modalInputFieldContainer}>
                        <input
                            type="text"
                            placeholder="Enter user description"
                            value={description}
                            maxLength={PROJECT_USER_DESCRIPTION_MAX_LENGTH}
                            onChange={(e) => setDescription(e.target.value)}
                            className={style.inputField} />
                    </div>
                    <div className={style.containerRoles}>
                        <div className={style.contentRole} style={{ marginTop: 21 }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M8.57143 9C10.5439 9 12.1429 7.32107 12.1429 5.25C12.1429 3.17893 10.5439 1.5 8.57143 1.5C6.59898 1.5 5 3.17893 5 5.25C5 7.32107 6.59898 9 8.57143 9Z" stroke="#D4D4D4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.7211 11.805L11.1925 14.46C11.0925 14.565 10.9996 14.76 10.9782 14.9025L10.8425 15.915C10.7925 16.2825 11.0353 16.5375 11.3853 16.485L12.3496 16.3425C12.4853 16.32 12.6782 16.2225 12.771 16.1175L15.2996 13.4625C15.7353 13.005 15.9425 12.4725 15.2996 11.7975C14.6639 11.13 14.1568 11.3475 13.7211 11.805Z" stroke="#D4D4D4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.3574 12.1875C13.5717 12.9975 14.1717 13.6275 14.9431 13.8525" stroke="#D4D4D4" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.43555 16.5C2.43555 13.5975 5.18557 11.25 8.57128 11.25C9.31414 11.25 10.0284 11.3625 10.6927 11.5725" stroke="#D4D4D4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Select role</span>
                        </div>
                        <div className={style.roles}>
                            {MemberProjectRolesArray.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRoleProject(role)}
                                    className={`${style.role} ${selectedRoleProject === role ? style.active : ''}`}>
                                    <span>{role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <hr />
                    <div className={style.buttons}>
                        <CustomButton
                            type={'Cancel'}
                            onClick={() => { onClose(); setSelectedBoardId(''); }} />
                        <CustomButton
                            type={'Asign'}
                            className={isShaking ? style.shake : ''}
                            onClick={saveChangesProject} />
                    </div>
                </>
            }
        </div>
    );
};

export default UserSettingsMenu;
