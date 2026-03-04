import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './UsersProjectModal.module.scss';
import { isOwnerOrManager } from '@Utils/Permissions';
import { useAlert } from '@Components/Alert/context';
import CloseButton from '@Components/CloseButton';
import UserCard from '@Components/Cards/User';
import { RootState } from '@Redux/store';


interface UsersProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectTitle: string;
}

const UsersProjectModal: React.FC<UsersProjectModalProps> = ({ isOpen, onClose, projectTitle }) => {
    const { showAlert } = useAlert();

    const userState = useSelector((state: RootState) => state.userReducer);
    const projectState = useSelector((state: RootState) => state.projectReducer);

    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isGetLink, setIsGetLink] = useState<boolean>(false);
    const [inviteLink, setInviteLink] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const verified = isOwnerOrManager(projectState, userState.id);


    const getInviteLink = async () => {
        if (isGetLink) return;

        try {
            setIsGetLink(true);
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectState.id}/invite`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // body: JSON.stringify({
                    //     ...(selectedBoardId ? { boardId: selectedBoardId } : {}),
                    //     ...(selectedLinkUsed ? { linkUsed: Number(selectedLinkUsed) } : {})
                    // })
                }
            );

            const data = await response.text();

            if (!response.ok) {
                const dataErr = await response.json();
                showAlert(`Server error: ${response.status}, ${dataErr.message}`);
                return;
            }

            setInviteLink(data);
        } catch (error) {
            showAlert(`Fetch failed: ${error}`);
        } finally {
            setIsGetLink(false);
        }
    };

    const handleCopy = async () => {
        try {
            if (isGetLink) {
                showAlert(`Wait, we are receiving a link`);
                return;
            }
            await navigator.clipboard.writeText(inviteLink);
            setIsCopied(true);

            setTimeout(() => setIsCopied(false), 1000);
        } catch (err) {
            console.error("Не удалось скопировать текст", err);
        }
    };

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        if (isOpen && !inviteLink && verified) {
            getInviteLink();

            timer = setTimeout(() => {
                setInviteLink('');
            }, 5 * 60 * 1000);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isOpen]);

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
                <div className={style.headerContainer}>
                    <a>{projectTitle}</a>
                    <span>List of users who participate in this project.</span>
                </div>
                {verified &&
                    <div
                        onClick={handleCopy}
                        className={`${style.inviteContainer} ${isCopied ? style.inviteContainerActive : ''}`}>
                        <span>{isCopied ? 'Copyed!' : 'Copy this link to invite new users.'}</span>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none">
                            <path d="M12 9.675V12.825C12 15.45 10.95 16.5 8.325 16.5H5.175C2.55 16.5 1.5 15.45 1.5 12.825V9.675C1.5 7.05 2.55 6 5.175 6H8.325C10.95 6 12 7.05 12 9.675Z" stroke="#303037" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16.5 5.175V8.325C16.5 10.95 15.45 12 12.825 12H12V9.675C12 7.05 10.95 6 8.325 6H6V5.175C6 2.55 7.05 1.5 9.675 1.5H12.825C15.45 1.5 16.5 2.55 16.5 5.175Z" stroke="#303037" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                }
                <div className={style.usersContainer}>
                    {projectState.members.map(member =>
                        <UserCard
                            key={member.id}
                            member={member}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                            permission={verified} />
                    )}
                </div>
            </div>
            <div className={style.buttonCloseContainer}>
                <CloseButton onClose={() => onClose()} />
            </div>
        </div>
    )
};

export default UsersProjectModal;
