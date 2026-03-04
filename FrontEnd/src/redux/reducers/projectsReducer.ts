import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IBoard, IProject } from './projectReducer';

export type IBoardPreviewCard = Pick<IBoard, 'id' | 'name' | 'color'>;
export type IProjectPreviewCard = Pick<IProject, 'id' | 'name' | 'ownerId'> & {
	boards: IBoardPreviewCard[];
};

const initialState: IProjectPreviewCard[] = [];

const projectsSlice = createSlice({
	name: 'projects',
	initialState,
	reducers: {
		setUserProjects: (state, action: PayloadAction<IProjectPreviewCard[]>) => {
			return action.payload;
		},
		addUserProject: (state, action: PayloadAction<IProjectPreviewCard>) => {
			state.push(action.payload);
		},
		updateProjectsName: (state, action: PayloadAction<{ projectId: string; projectName: string }>) => {
			const { projectId, projectName } = action.payload;

			const project = state.find(p => p.id == projectId);
			if (project) {
				project.name = projectName;
			}
		},
		removeProject: (state, action: PayloadAction<{ projectId: string; }>) => {
			const { projectId } = action.payload;

			return state.filter(project => project.id !== projectId);
		},
		addBoardProjects: (state, action: PayloadAction<{ projectId: string; board: IBoardPreviewCard }>) => {
			const { projectId, board } = action.payload;
			const project = state.find(p => p.id === projectId);
			if (project)
				if (!project.boards.some((b) => b.id === board.id))
					project.boards.push(board);
		},
		updateBoardProjects: (state, action: PayloadAction<{ boardId: string; newName: string; newColor: number; }>) => {
			const { boardId, newName, newColor } = action.payload;

			for (const project of state) {
				const board = project.boards.find(b => b.id === boardId);
				if (board) {
					board.name = newName ? newName : board.name;
					board.color = newColor !== board.color ? newColor : board.color;
					break;
				}
			}
		},
		deleteBoardProjects: (state, action: PayloadAction<{ projectId: string; boardId: string; }>) => {
			const { boardId, projectId } = action.payload;

			if (projectId) {
				const project = state.find(p => p.id === projectId);
				if (!project || !Array.isArray(project.boards)) return;
				const idx = project.boards.findIndex(b => b.id === boardId);
				if (idx !== -1) project.boards.splice(idx, 1);
				return;
			}

			for (const project of state) {
				if (!Array.isArray(project.boards)) continue;
				const idx = project.boards.findIndex(b => b.id === boardId);
				if (idx !== -1) {
					project.boards.splice(idx, 1);
					break;
				}
			}
		}
	},
});

export const {
	setUserProjects,
	addUserProject,
	removeProject,
	addBoardProjects,
	updateBoardProjects,
	deleteBoardProjects,
	updateProjectsName
} = projectsSlice.actions;

export default projectsSlice.reducer;