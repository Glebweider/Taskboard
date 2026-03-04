import React, { useState } from 'react';

import style from './ColorModal.module.scss';
import { useAlert } from '@Components/Alert/context';
import { IBoardPreviewCard } from '@Redux/reducers/projectsReducer';


interface ColorModalProps {
    isOpen: boolean;
    projectId: string;
    board: IBoardPreviewCard;
    colors: string[];
    onClose: () => void;
}

const ColorModal: React.FC<ColorModalProps> = ({ isOpen, projectId, board, colors, onClose }) => {
    const { showAlert } = useAlert();

    const [selectedColor, setSelectedColor] = useState<number>(board.color);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);


    const update = async (index: number) => {
        if (isUpdating) return;

        setSelectedColor(index)
        setIsUpdating(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${board.id}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        color: index
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
            setIsUpdating(false);
        }
    };

    if (!isOpen) return <></>;

    return (
        <div
            className="modalOverlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}>
            <div className={style.content} onMouseDown={(e) => e.stopPropagation()}>
                <text>Select colors for {board.name}</text>
                <div className={style.colors}>
                    {colors.map((color, index) =>
                        <div
                            key={index}
                            onClick={() => update(index)}
                            className={`${style.color} ${selectedColor == index ? style.selected : ''}`}
                            style={{ backgroundColor: color }} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorModal;
