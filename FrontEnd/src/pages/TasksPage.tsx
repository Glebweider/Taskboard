import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import style from '@Styles/pages/TasksPage.module.scss';
import styleUser from '@Components/Users/Users.module.scss';
import { ICard, IUserProject } from '@Redux/reducers/projectReducer';
import { useGetMyTasks } from '@Utils/fetch/getTasksByProjectId';
import { formatDateShort, formatDateLong, getDueDateColor } from '@Utils';
import { Avatar } from '@Components/Avatar';
import { TASK_MEMBER_VISIBILITY } from '@Utils/constants';


type UserTaskMember = Pick<IUserProject, 'id' | 'avatar'> & { username: IUserProject['name']; };
type UserTaskBase = Pick<ICard, 'id' | 'title' | 'dueDate' | 'status' | 'createdAt'>;
export type IUserTask = UserTaskBase & {
	members: UserTaskMember[];
	projectId: string;
	projectName: string;
	boardId: string;
	boardName: string;
};

const TasksPage = () => {
	const navigate = useNavigate();
	const { getMyTasks } = useGetMyTasks();
	const [tasks, setTasks] = useState<IUserTask[]>([]);
	const [isLoading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchTasks = async () => {
			const tasks = await getMyTasks();
			setTasks(tasks);
			setLoading(false);
		};
		fetchTasks();
	}, []);

	// const getTaskStatusClass = (task: IUserTask) => {
	// 	if (task.status === ECardStatus.COMPLETE) return style.success;
	// 	if (!task.dueDate) return '';

	// 	const now = new Date().getTime();
	// 	const start = new Date(task.createdAt).getTime();
	// 	const end = new Date(task.dueDate).getTime();

	// 	const totalTime = end - start;
	// 	const remaining = end - now;

	// 	const remainingPercent = (remaining / totalTime) * 100;

	// 	if (remainingPercent <= 10) return style.warning;
	// 	return style.wait;
	// };

	const goToProject = (projectId: string, boardId: string, taskId: string) => {
		navigate(`/projects?projectId=${projectId}&boardId=${boardId}&open=${taskId}`);
	};

	return (
		<>
			<div className={style.container}>
				{!isLoading &&
					(tasks.length > 0 ? (
						Object.entries(
							tasks.reduce<Record<string, IUserTask[]>>((acc, task) => {
								if (!acc[task.boardName]) acc[task.boardName] = [];
								acc[task.boardName].push(task);
								return acc;
							}, {})
						).map(([boardName, boardTasks]) => (
							<div key={boardName} className={style.board}>
								<div className={style.containerData}>
									<div className={style.data}>
										<span>Project: {boardTasks[0].projectName}</span>
										<h1>Board: {boardName}</h1>
									</div>
									<img src="./icons/Drag.svg" />
								</div>
								<div className={style.tasks}>
									{boardTasks.map(task => (
										<div
											key={task.id}
											className={`${style.taskCard} ${task.dueDate && style[getDueDateColor(task.dueDate)]}`}
											onClick={() => goToProject(task.projectId, task.boardId, task.id)}>
											<div className={style.title}>{task.title}</div>
											<div className={style.content}>
												<span className={`${style.dueDate} ${task.dueDate ? '' : style.disable}`}>
													{task.dueDate ? formatDateShort(task.dueDate) : 'no date set'}
												</span>

												<div className={styleUser.users}>
													{task.members.length > TASK_MEMBER_VISIBILITY && (
														<span>+{task.members.length - TASK_MEMBER_VISIBILITY}</span>
													)}
													<div className={styleUser.avatars}>
														{task.members.slice(0, TASK_MEMBER_VISIBILITY).map(member => (
															<Avatar 
																key={member.id} 
																size={22} 
																className={`${styleUser.user} ${task.dueDate ? 
																	styleUser[getDueDateColor(task.dueDate)] : 
																	styleUser.disable}`} 
																user={member} />
														))}
													</div>
												</div>
											</div>
											<hr />
											<div className={style.createDate}>Created on {formatDateLong(task.createdAt)}</div>
										</div>
									))}
								</div>
							</div>
						))
					) : (
						<div className={style.emptyList}>
							<img src="./icons/IDK.svg" />
							<span>It looks like you don't have any tasks.</span>
						</div>
					))}
			</div>
		</>
	);
};

export default TasksPage;
