import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';

import style from './BoardCard.module.scss';
import { IBoardPreviewCard, IProjectPreviewCard } from '@Redux/reducers/projectsReducer';
import { RootState } from '@Redux/store';
import BoardMenu from '@Components/Menus/Board';
import ColorModal from '@Components/Modals/Color';
import { isOwnerOrManager } from '@Utils';


const Colors = [
    '#9983F8',
    '#EF8683',
    '#EF869F',
    '#C6FD8F',
    '#B081F7',
    '#F6C689',
    '#D4D4D4',
    '#A0FCBE',
    '#D884F8',
    '#FEFB90',
    '#FFFFFF',
    '#94D6FB',
];

interface BoardCardProps {
    project: IProjectPreviewCard;
    board: IBoardPreviewCard;
    boardId: string | null;
    setProjects: React.Dispatch<React.SetStateAction<IProjectPreviewCard[]>>;
}

const BoardCard: React.FC<BoardCardProps> = ({
    project,
    board,
    boardId,
    setProjects,
}) => {
    const userState = useSelector((state: RootState) => state.userReducer);
    const projectState = useSelector((state: RootState) => state.projectReducer);

    const [isOpenBoardMenu, setIsOpenBoardMenu] = useState<boolean>(false);
    const [isOpenColorMenu, setIsOpenColorMenu] = useState<boolean>(false);

    const userVerified = isOwnerOrManager(projectState, userState.id);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    const openMenu = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
            setIsOpenBoardMenu(true);
        }
    }

    return (
        <>
            <div className={style.boardWrapper}>
                <Link
                    key={board.id}
                    to={`/projects?projectId=${project.id}&boardId=${board.id}`}
                    className={`${style.containerBoard} ${boardId === board.id ? style.containerActiveBoard : ''}`}>
                    <div>
                        <span
                            ref={buttonRef}
                            onClick={() => {
                                if (userVerified)
                                    setIsOpenColorMenu(true);
                            }}
                            style={{ backgroundColor: Colors[board.color] }} />
                        <h1>{board.name}</h1>
                    </div>
                    {userVerified &&
                        <img
                            src='./icons/Settings.svg'
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openMenu();
                            }} />
                    }
                </Link>
                {isOpenBoardMenu && createPortal(
                    <BoardMenu
                        styles={{ position: 'absolute', top: coords.top, left: coords.left }}
                        isOpen={isOpenBoardMenu}
                        project={project}
                        board={board}
                        onClose={() => setIsOpenBoardMenu(false)}
                        setProjects={setProjects} />,
                    document.body
                )}
            </div>
            {createPortal(
                <ColorModal
                    projectId={project.id}
                    colors={Colors}
                    board={board}
                    isOpen={isOpenColorMenu}
                    onClose={() => setIsOpenColorMenu(false)} />,
                document.body
            )}
        </>
    );
};

export default BoardCard;
