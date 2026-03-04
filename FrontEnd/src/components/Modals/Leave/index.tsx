import { useState } from 'react';

import style from './LeaveModal.module.scss';
import { useAlert } from '@Components/Alert/context';


export enum ETypeLeave {
    LEAVE = 'leave',
    LEAVEPROJECT = 'leave project'
}

interface LeaveModalProps {
    isOpen: boolean;
    type: ETypeLeave;
    title?: string;
    onClose: () => void;
    onSubmit: () => Promise<void>;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, type, title, onClose, onSubmit }) => {
    const { showAlert } = useAlert();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    
    const leave = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            await onSubmit();
            onClose();
        } catch (error) {
            showAlert(`Error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className={style.modalContentContainer}>
                    <div className={style.modalHeader}>
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                            <path d="M9.6416 8.19001C9.97743 4.29001 11.9816 2.69751 16.3691 2.69751H16.5099C21.3524 2.69751 23.2916 4.63668 23.2916 9.47918V16.5425C23.2916 21.385 21.3524 23.3242 16.5099 23.3242H16.3691C12.0141 23.3242 10.0099 21.7533 9.65244 17.9183" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16.25 13H3.92163" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6.33742 9.37085L2.70825 13L6.33742 16.6292" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {type == ETypeLeave.LEAVE ?
                            <a>Are you sure you want to log out?</a>
                            :
                            <>
                                <a>Are you sure you want to leave the project</a>
                                <h1>{title}</h1>
                                <span>You will lose access to project resources.</span>
                            </>
                        }
                    </div>
                    <div className={style.modalButtons}>
                        <div
                            className={style.closeButton}
                            onClick={() => { onClose(); }}>
                            Decline
                        </div>
                        <div
                            className={style.leaveButton}
                            onClick={leave}
                            style={{ opacity: isLoading ? 0.5 : 1 }}>
                            Accept
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default LeaveModal;
