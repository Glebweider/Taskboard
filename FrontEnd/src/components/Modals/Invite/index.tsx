import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import style from './InviteModal.module.scss';
import { useAlert } from '@Components/Alert/context';
import { addUserProject } from '@Redux/reducers/projectsReducer';
import CustomButton from '@Components/Button';


interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const inviteId = localStorage.getItem('inviteId');
    const inviteName = localStorage.getItem('inviteName');


    const Close = () => {
        localStorage.removeItem('inviteId');
        localStorage.removeItem('inviteName');
        localStorage.removeItem('projectId');
        onClose();
    }

    const Invite = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/invite/${inviteId}`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            const data = await response.json();
            if (!response.ok) {
                showAlert(`Server error: ${response.status}, ${data.message}`);
                return;
            }

            dispatch(addUserProject(data));
            Close();
        } catch (error) {
            showAlert(`Error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return <></>;

    return (
        <div className="modalOverlay">
            <div className={style.content} onMouseDown={(e) => e.stopPropagation()}>
                <text>{inviteName}</text>
                <span>Someone invites you</span>
                <div className={style.modalContentContainerFooter}>
                    <CustomButton
                        type={'Cancel'}
                        onClick={onClose} />
                    <CustomButton
                        type={'Asign'}
                        onClick={Invite} />
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
