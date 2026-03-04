import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './CreateNewTaskUsers.module.scss';
import { RootState } from '@Redux/store';
import { Avatar } from '@Components/Avatar';
import { EBoardMemberRole } from '@Redux/reducers/projectReducer';
import CustomButton from '@Components/Button';


interface CreateNewTaskUsersProps {
    isOpen: boolean;
    boardId: string;
    selectedUsers: string[];
    onClose: () => void;
    onSave: (newUsers: any[]) => void;
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
}

const CreateNewTaskUsers: React.FC<CreateNewTaskUsersProps> = ({
    isOpen,
    boardId,
    selectedUsers,
    onClose,
    onSave,
    setSelectedUsers
}) => {
    const projectState = useSelector((state: RootState) => state.projectReducer);

    const [search, setSearch] = useState<string>('');
    const [users, setUsers] = useState<string[]>([]);

    const board = projectState.boards.find(b => b.id === boardId);
    const filteredMembers = projectState.members
        .filter(user =>
            board?.members.some(m => m.id === user.id && m.role !== EBoardMemberRole.OBSERVER) &&
            user.name.toLowerCase().includes(search.toLowerCase())
        );

    const handleSelectedUser = (user: any) => {
        if (users.includes(user.id)) {
            setUsers(prev => prev.filter(id => id !== user.id));
        } else {
            setUsers(prev => [...prev, user.id]);
        }
    };

    useEffect(() => {
        setUsers(selectedUsers);
    }, [selectedUsers, isOpen]);

    if (!isOpen) return <></>;

    return (
        <div className="modalOverlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}>
            <div
                className={style.modalContent}
                onMouseDown={(e) => e.stopPropagation()}>
                <div className={style.modalContentContainerHeader}>
                    <div className={style.modalHeader}>
                        <h1>Users:</h1>
                        <span>List of users who participate in this project.</span>
                    </div>
                    <div className={style.inputFieldContainer}>
                        <div className={style.inputFieldContent}>
                            <input
                                type="text"
                                placeholder="Search"
                                value={search}
                                maxLength={48}
                                onChange={(e) => setSearch(e.target.value)}
                                className={style.inputField} />
                            <hr />
                        </div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="#303037" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 22L20 20" stroke="#303037" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className={style.members}>
                        {filteredMembers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleSelectedUser(user)}
                                className={`${users.includes(user.id) ? style.selected : style.notselected} ${style.member}`}>
                                <Avatar user={user} size={50} />
                                <span>{user.displayName ? user.displayName : user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={style.modalContentContainerFooter}>
                    <CustomButton
                        type={'Cancel'}
                        onClick={onClose} />
                    <CustomButton
                        type={'Asign'}
                        onClick={() => {
                            onClose();
                            setSelectedUsers(users);
                            onSave(users);
                        }} />
                </div>
            </div>
        </div>
    )
};

export default CreateNewTaskUsers;
