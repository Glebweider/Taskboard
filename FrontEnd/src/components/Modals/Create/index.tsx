import { useEffect, useRef, useState } from 'react';

import style from './CreateModal.module.scss';
import { useAlert } from '@Components/Alert/context';


interface CreateModalProps {
    isOpen: boolean;
    placholder: string;
    title?: string;
    minLength?: number;
    maxLength: number;
    onClose: () => void;
    onSubmit: (value: string) => Promise<void>;
}

const CreateModal: React.FC<CreateModalProps> = ({
    isOpen,
    placholder,
    title,
    minLength,
    maxLength,
    onClose,
    onSubmit
}) => {
    const { showAlert } = useAlert();

    const [value, setValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const inputRef = useRef<HTMLInputElement | null>(null);


    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && title) {
            setValue(title);
        }
    }, [isOpen]);

    const createFunc = async () => {
        if (isLoading) return;

        if (value.length < (minLength == 0 ? minLength : 1)) {
            showAlert(`${placholder.replace(":", "")} must be at least 1 character`);
            return;
        }
        if (value.length > maxLength) {
            showAlert(`${placholder.replace(":", "")} must be no more than ${maxLength} characters`);
            return;
        }

        setIsLoading(true);

        try {
            await onSubmit(value);
            setValue('');
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
                    setValue('');
                }
            }}>
            <div
                className={style.modalContent}
                onMouseDown={(e) => e.stopPropagation()}>
                <div className={style.modalContentContainer}>
                    <div className={style.modalHeader}>
                        <img src="./icons/Edit.svg" />
                        <a>{placholder}</a>
                    </div>

                    <div className={style.modalData}>
                        <div className={style.modalInputFieldContainer}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Enter name"
                                value={value}
                                maxLength={maxLength}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        createFunc();
                                    }
                                }}
                                className={style.inputField}
                            />
                        </div>
                        <hr />
                    </div>

                    <div className={style.modalButtons}>
                        <div
                            className={style.closeButton}
                            onClick={() => { onClose(); setValue(''); }}>
                            Decline
                        </div>
                        <div
                            className={style.createButton}
                            onClick={createFunc}
                            style={{ opacity: isLoading ? 0.5 : 1 }}>
                            Accept
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CreateModal;
