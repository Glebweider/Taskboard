import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import style from '@Styles/pages/ProjectsPage.module.scss';
import { useAlert } from '@Components/Alert/context';
import ProjectCard from '@Components/Cards/Project';
import BoardList from '@Components/BoardList';
import CreateModal from '@Components/Modals/Create';
import { BOARDS_LIMIT, LIST_NAME_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH, PROJECTS_LIMIT } from '@Utils/constants';
import { IProjectPreviewCard, setUserProjects } from '@Redux/reducers/projectsReducer';
import { setProjectId } from '@Redux/reducers/projectReducer';
import { useGetProject } from '@Utils/fetch/getProjectById';
import TaskFormModal from '@Components/Modals/Task';
import { isBoardAdmin, sseCore } from '@Utils';
import { RootState } from '@Redux/store';
import InviteModal from '@Components/Modals/Invite';


const ProjectsPage = () => {
	const location = useLocation();
	const { showAlert } = useAlert();
	const { getProject } = useGetProject();
	const dispatch = useDispatch();

	const userState = useSelector((state: RootState) => state.userReducer);
	const projectState = useSelector((state: RootState) => state.projectReducer);
	const projectsState = useSelector((state: RootState) => state.projectsReducer);

	const [projects, setProjects] = useState<IProjectPreviewCard[]>(projectsState);
	const [selectedListId, setSelectedListId] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isOpenModalCreateProject, setIsOpenModalCreateProject] = useState<boolean>(false);
	const [isOpenModalCreateList, setIsOpenModalCreateList] = useState<boolean>(false);
	const [isOpenModalCreateTask, setIsOpenModalCreateTask] = useState<boolean>(false);
	const [isOpenModalInvite, setIsOpenModalInvite] = useState<boolean>(false);

	const searchParams = new URLSearchParams(location.search);

	const inviteId = localStorage.getItem('inviteId');
	const projectId = searchParams.get('projectId');
	const boardId = searchParams.get('boardId');

	const verified = isBoardAdmin(projectState, boardId!, userState.id);


	useEffect(() => {
		if (isLoading || !inviteId) return;

		const projectId = localStorage.getItem('projectId');
		if (projects?.length) {
			const exists = projects.some(p => p.id === projectId);

			if (exists) {
				localStorage.removeItem('inviteId');
				localStorage.removeItem('inviteName');
				localStorage.removeItem('projectId');
				return;
			}
		}

		setIsOpenModalInvite(true);
	}, [isLoading, inviteId, projects]);


	useEffect(() => {
		if (projects.length == 0) {
			getProjects();
		}
	}, []);

	useEffect(() => {
		if (!projectId) return;

		if (projectState.id !== projectId || !projectState.name) {
			dispatch(setProjectId({ id: projectId }));
			getProject(projectId);
		}
	}, [boardId, projectId]);

	useEffect(() => {
		setProjects(projectsState);
	}, [projectsState]);

	useEffect(() => {
		const unsubscribe = sseCore.subscribe((event) => {
			if (event.entity === "board" && event.type === "create") {
				const newBoard = { id: event.payload.id, name: event.payload.name, color: event.payload.color };

				setProjects(prev =>
					prev.map(project =>
						project.id === projectState.id
							? { ...project, boards: [...project.boards, newBoard] }
							: project
					)
				);
			}
		});

		return unsubscribe;
	}, [projectState.id]);

	const getProjects = async () => {
		try {
			setIsLoading(true);

			const response = await fetch(
				`${process.env.REACT_APP_BACKEND_URI}/projects/preview`,
				{
					method: 'GET',
					credentials: 'include',
				}
			);

			const data = await response.json();

			if (!response.ok) {
				showAlert(`Server error: ${response.status}, ${data.message?.message}`);
				return;
			}

			setProjects(data);
			dispatch(setUserProjects(data));
			setIsLoading(false);
		} catch (error) {
			showAlert(`Fetch failed: ${error}`);
			setIsLoading(false);
		}
	};

	if (isLoading) return <div className={style.container}></div>

	return (
		<div className={style.container}>
			{!isLoading &&
				(projects.length == 0 ?
					<div className={style.containerNewProject}>
						<div className={style.containerHeader}>
							<span className={style.textHeader}>Create your first project</span>
							<span className={style.textDescription}>or get invite at another projects</span>
						</div>
						<div
							onClick={() => setIsOpenModalCreateProject(true)}
							className={style.buttonAdd}>
							<div className={style.containerAdd}>
								<svg width="35" height="32" viewBox="0 0 35 32" fill="none">
									<g opacity="0.15">
										<rect x="14.9886" width="4.66667" height="31.4539" rx="2.33333" fill="#D9D9D9" />
										<rect x="35.0001" y="14.6786" width="4.19385" height="35" rx="2.09692" transform="rotate(90 35.0001 14.6786)" fill="#D9D9D9" />
									</g>
								</svg>
							</div>
						</div>
					</div>
					:
					<div style={{ display: 'flex', marginTop: 67, height: '100%' }}>
						<div className={style.containerProjects}>
							{projects.map(project => (
								<ProjectCard
									key={project.id}
									project={project}
									setProjects={setProjects} />
							))}
							{projects?.length < PROJECTS_LIMIT &&
								<div
									onClick={() => setIsOpenModalCreateProject(true)}
									className={style.containerAddProject}>
									<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
										<rect x="3" width="2" height="8" rx="1" fill="#D4D4D4" />
										<rect x="8" y="3" width="2" height="8" rx="1" transform="rotate(90 8 3)" fill="#D4D4D4" />
									</svg>
									{/* SVG - Copy Paste, TODO: Move to SVG File */}
									<span>Add project</span>
								</div>
							}
						</div>
						{projectState && boardId &&
							<div className={style.contentProject}>
								{projectState?.boards
									?.find(board => board.id === boardId)?.lists.map(list => (
										<BoardList
											key={list.id}
											list={list}
											boardId={boardId}
											userState={userState}
											projectState={projectState}
											setSelectedListId={setSelectedListId}
											setOpenModalCreateTask={setIsOpenModalCreateTask} />
									))}
								{(verified && projectState?.boards?.length < BOARDS_LIMIT) &&
									<div
										onClick={() => setIsOpenModalCreateList(true)}
										className={style.addListToBoard}>
										<div className={style.containerAddListToBoard}>
											<svg width="26" height="26" viewBox="0 0 26 26" fill="none">
												<rect x="10" width="6" height="26" rx="2" fill="#222225" />
												<rect x="26" y="10" width="6" height="26" rx="2" transform="rotate(90 26 10)" fill="#222225" />
											</svg>
											{/* SVG - Copy Paste, TODO: Move to SVG File */}
										</div>
									</div>
								}
							</div>
						}
					</div>
				)}

			{/* Create Project Modal */}
			<CreateModal
				isOpen={isOpenModalCreateProject}
				onClose={() => setIsOpenModalCreateProject(!isOpenModalCreateProject)}
				placholder={'Project name:'}
				maxLength={PROJECT_NAME_MAX_LENGTH}
				onSubmit={async (name) => {
					const response = await fetch(
						`${process.env.REACT_APP_BACKEND_URI}/projects/`,
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

					setProjects(prevProjects => [...prevProjects, {
						id: data.id,
						name: data.name,
						ownerId: data.ownerId,
						boards: data.boards
					}]);
				}} />

			{/* Create List Modal */}
			<CreateModal
				isOpen={isOpenModalCreateList}
				onClose={() => setIsOpenModalCreateList(!isOpenModalCreateList)}
				placholder={'List name:'}
				minLength={0}
				maxLength={LIST_NAME_MAX_LENGTH}
				onSubmit={async (name) => {
					const response = await fetch(
						`${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}/boards/${boardId}/lists/`,
						{
							method: 'POST',
							credentials: 'include',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								name: name || 'New List',
							})
						}
					);

					if (!response.ok) {
						const data = await response.json();
						showAlert(`Server error: ${response.status}, ${data.message?.message}`);
						return;
					}
				}} />

			{/* Create Task Modal */}
			<TaskFormModal
				isOpen={isOpenModalCreateTask}
				onClose={() => setIsOpenModalCreateTask(!isOpenModalCreateTask)}
				projectId={projectId || ''}
				boardId={boardId || ''}
				listId={selectedListId}
				projectState={projectState}
				userState={userState} />

			{/* Invite Project Modal */}
			<InviteModal
				isOpen={isOpenModalInvite}
				onClose={() => setIsOpenModalInvite(false)} />
		</div>
	);
};

export default ProjectsPage;
