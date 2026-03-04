import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import style from './ProjectCard.module.scss';
import ProjectMenu from '@Components/Menus/Project';
import { addBoardProjects, IProjectPreviewCard } from '@Redux/reducers/projectsReducer';
import { setProjectId } from '@Redux/reducers/projectReducer';
import { RootState } from '@Redux/store';
import { BOARD_NAME_MAX_LENGTH, BOARDS_LIMIT } from '@Utils/constants';
import BoardCard from '@Components/Cards/Board';
import CreateModal from '@Components/Modals/Create';
import { useAlert } from '@Components/Alert/context';
import { isOwnerOrManager } from '@Utils/Permissions';


interface ProjectCardProps {
    project: IProjectPreviewCard;
    setProjects: React.Dispatch<React.SetStateAction<IProjectPreviewCard[]>>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, setProjects }) => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const userState = useSelector((state: RootState) => state.userReducer);
    const projectState = useSelector((state: RootState) => state.projectReducer);

    const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
    const [isOpenModalCreateBoard, setOpenModalCreateBoard] = useState<boolean>(false);
    const [boardsHeight, setBoardsHeight] = useState<number>(0);
    const boardsRef = useRef<HTMLDivElement>(null);

    const projectId = searchParams.get('projectId');
    const boardId = searchParams.get('boardId');
    const isOpenBoards = projectId === project.id;

    const verified = isOwnerOrManager({ ...project, members: projectState.members }, userState.id);


    useLayoutEffect(() => {
        if (!isOpenBoards || !boardsRef.current) return;

        setBoardsHeight(boardsRef.current.scrollHeight);
    }, [project.boards.length, verified, isOpenBoards]);

    const openProject = () => {
        navigate(`?projectId=${project.id}`);
    };

    const closeProject = () => {
        navigate(`/projects`);
    };

    return (
        <>
            <div style={{ position: 'relative', display: 'flex' }}>
                <div className={style.projectContainer}>
                    <div
                        className={style.projectHeader}
                        onClick={(e) => {
                            e.stopPropagation();
                            isOpenBoards ? closeProject() : openProject();
                        }}>
                        <div className={style.headerLeft}>
                            <img
                                className='settingsBtn'
                                src='./icons/Settings.svg'
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openProject();
                                    setIsOpenMenu(true);
                                }} />
                            <span className={style.projectName}>{project.name}</span>
                        </div>
                        <Link
                            onClick={() => dispatch(setProjectId({ id: project.id }))}
                            to={`/projects${!isOpenBoards ? `?projectId=${project.id}` : ''}`}>
                            <img
                                className={`${isOpenBoards ? style.active : ''} ${style.arrowIcon}`}
                                src='./icons/Arrow.svg' />
                        </Link>
                    </div>

                    <div
                        className={style.projectBoardsWrapper}
                        style={{
                            height: isOpenBoards ? boardsHeight : 0
                        }}>
                        <div ref={boardsRef} className={style.projectBoardsInner}>
                            {project.boards?.map((board: any) => (
                                <BoardCard
                                    key={board.id}
                                    project={project}
                                    board={board}
                                    boardId={boardId}
                                    setProjects={setProjects} />
                            ))}
                            {(verified && (project?.boards?.length < BOARDS_LIMIT)) &&
                                <div
                                    onClick={() => setOpenModalCreateBoard(true)}
                                    className={`${style.containerAddBoard} ${project?.boards?.length < 0 ? style.active : ''}`}>
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                        <rect x="3" width="2" height="8" rx="1" fill="#D4D4D4" />
                                        <rect x="8" y="3" width="2" height="8" rx="1" transform="rotate(90 8 3)" fill="#D4D4D4" />
                                    </svg>
                                    {/* SVG - Copy Paste, TODO: Move to SVG File */}
                                    <span>Add board</span>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <ProjectMenu
                    isOpen={isOpenMenu}
                    project={project}
                    onClose={() => setIsOpenMenu(false)}
                    setProjects={setProjects} />
            </div>

            {/* Create Board Modal */}
            <CreateModal
                isOpen={isOpenModalCreateBoard}
                onClose={() => setOpenModalCreateBoard(!isOpenModalCreateBoard)}
                placholder={'Board name:'}
                maxLength={BOARD_NAME_MAX_LENGTH}
                onSubmit={async (name) => {
                    const response = await fetch(
                        `${process.env.REACT_APP_BACKEND_URI}/projects/${project.id}/boards`,
                        {
                            method: 'POST',
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

                    dispatch(addBoardProjects({
                        projectId: project.id,
                        board: data
                    }));

                    navigate(`?projectId=${project.id}&boardId=${data.id}`, { replace: true });
                }} />
        </>
    );
};

export default ProjectCard;
