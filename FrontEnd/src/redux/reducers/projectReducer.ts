import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IProjectEvent {
	type: 'create' | 'update' | 'delete' | 'add' | 'change' | 'remove';
	entity: 'project' | 'board' | 'list' | 'card' | 'comment';
	payload: any;
	path?: string;
}

export enum EBoardMemberRole {
	ADMIN = 'Administrator',
	NORMAL = 'Performer',
	OBSERVER = 'Observer',
}

export enum EProjectMemberRole {
	MANAGER = 'Manager',
	USER = 'User',
}

export enum ECardStatus {
	NONE = 'none',
	COMPLETE = 'complete',
}

export interface IProject {
	id: string;
	discordId: string;
	name: string;
	ownerId: string;
	members: IUserProject[];
	boards: IBoard[];
	dateOfCreation: string;
	discordIntegration: IDiscordIntegration;
}

export interface IDiscordIntegration {
	updateChannelId: string;
	// summary: {
	// 	enabled: boolean;
	// 	time: Date;
	// 	channelId: string;
	// }
}

export interface IBoard {
	id: string;
	name: string;
	members: IBoardMember[];
	lists: IList[];
	color: number;
}

export interface IUserProject {
	id: string;
	name: string;
	avatar: string;
	displayName: string;
	description: string;
	role: EProjectMemberRole;
	dateOfCreation: string;
}

export interface IBoardMember {
	id: string;
	role: EBoardMemberRole;
}

export interface IList {
	id: string;
	position: number;
	name: string;
	cards: ICard[];
}

export interface ICard {
	id: string;
	position: number;
	title: string;
	status: ECardStatus;
	description: string;
	members: string[];
	dueDate: string | null;
	createdAt: string;
}

const initialState: IProject = {
	id: '',
	discordId: '',
	name: '',
	ownerId: '',
	members: [],
	boards: [],
	dateOfCreation: '',
	discordIntegration: {
		updateChannelId: ''
	}
};

const projectSlice = createSlice({
	name: 'project',
	initialState,
	reducers: {
		/* Project */
		setProjectId: (state, action: PayloadAction<{ id: string; }>) => {
			return {
				...initialState,
				id: action.payload.id,
			};
		},
		setProject: (state, action: PayloadAction<IProject>) => {
			const discordIntegration = action.payload.discordIntegration || { updateChannelId: '' };
			state.id = action.payload.id;
			state.discordId = action.payload.discordId;
			state.name = action.payload.name;
			state.ownerId = action.payload.ownerId;
			state.members = action.payload.members;
			state.boards = action.payload.boards;
			state.dateOfCreation = action.payload.dateOfCreation;
			state.discordIntegration = discordIntegration;
		},
		updateProjectName: (state, action: PayloadAction<string>) => {
			state.name = action.payload;
		},
		updateDiscordChannelId: (state, action: PayloadAction<string>) => {
			if (state.discordIntegration) {
				state.discordIntegration.updateChannelId = action.payload;
			} else {
				state.discordIntegration = { updateChannelId: action.payload };
			}
		},
		clearProject: () => initialState,

		/* Members */
		addProjectMember: (state, action: PayloadAction<{ user: IUserProject; boardId?: string, role?: EBoardMemberRole }>) => {
			const { user, boardId, role } = action.payload;

			if (!state.members.find((m) => m.id === user.id))
				state.members.push(user);

			state.boards.forEach((board) => {
				if (!board.members.find((m) => m.id === user.id)) {
					board.members.push({
						id: user.id,
						role: board.id === boardId ? role || EBoardMemberRole.NORMAL : EBoardMemberRole.OBSERVER,
					});
				}
			});
		},
		updateProjectMember: (state, action: PayloadAction<{ userId: string; role?: EProjectMemberRole; description?: string; displayName?: string; }>) => {
			const { userId, role, description, displayName } = action.payload;

			const user = state.members.find(m => m.id === userId);
			if (!user) return;

			if (role !== undefined) {
				user.role = role;
			}

			if (description !== undefined) {
				user.description = description;
			}

			if (displayName !== undefined) {
				user.displayName = displayName;
			}
		},
		removeProjectMember: (state, action: PayloadAction<string>) => {
			const userIdToRemove = action.payload;

			state.members = state.members.filter((member) => member.id !== userIdToRemove);

			state.boards.forEach((board) => {
				board.members = board.members.filter((member) => member.id !== userIdToRemove);
			});

			state.boards.forEach((board) => {
				board.lists.forEach((list) => {
					list.cards.forEach((card) => {
						card.members = card.members.filter((id) => id !== userIdToRemove);
					});
				});
			});
		},

		/* Board Members in Card */
		addCardMember: (state, action: PayloadAction<{ boardId: string; listId: string; cardId: string; userId: string }>) => {
			const { boardId, listId, cardId, userId } = action.payload;
			const board = state.boards.find(b => b.id === boardId);
			if (board) {
				const list = board.lists.find(l => l.id === listId);
				if (list) {
					const card = list.cards.find(c => c.id === cardId);
					if (card) {
						if (!card.members) {
							card.members = [];
						}
						if (!card.members.includes(userId)) {
							card.members.push(userId);
						}
					}
				}
			}
		},
		removeCardMember: (state, action: PayloadAction<{ boardId: string; listId: string; cardId: string; userId: string }>) => {
			const { boardId, listId, cardId, userId } = action.payload;
			const board = state.boards.find(b => b.id === boardId);
			if (board) {
				const list = board.lists.find(l => l.id === listId);
				if (list) {
					const card = list.cards.find(c => c.id === cardId);
					if (card && card.members) {
						card.members = card.members.filter(id => id !== userId);
					}
				}
			}
		},

		/* Boards */
		addBoard(state, action: PayloadAction<IBoard>) {
			state.boards.push(action.payload);
		},
		updateBoard(state, action: PayloadAction<{ boardId: string; newName: string; newColor: number; }>) {
			const { boardId, newName, newColor } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				board.name = newName ? newName : board.name;
				board.color = newColor ? newColor : board.color;
			}
		},
		deleteBoard(state, action: PayloadAction<string>) {
			state.boards = state.boards.filter(
				(board) => board.id !== action.payload
			);
		},
		updateBoardMemberRole: (state, action: PayloadAction<{ boardId: string; userId: string; newRole: EBoardMemberRole; }>) => {
			const { boardId, userId, newRole } = action.payload;
			const board = state.boards.find(b => b.id === boardId);
			if (board) {
				const member = board.members.find(m => m.id === userId);
				if (member) {
					member.role = newRole;
				}
			}
		},

		/* Lists */
		addList: (state, action: PayloadAction<{ boardId: string; list: IList }>) => {
			const { boardId, list } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				board.lists.push(list);
			}
		},
		deleteList: (state, action: PayloadAction<{ boardId: string; listId: string }>) => {
			const { boardId, listId } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				board.lists = board.lists.filter((list) => list.id !== listId);
			}
		},
		listMove: (state, action: PayloadAction<{ boardId: string; listId: string; toPosition: number }>) => {
			const { boardId, listId, toPosition } = action.payload;

			const board = state.boards.find(b => b.id === boardId);
			if (!board) return;

			const listIndex = board.lists.findIndex(l => l.id === listId);
			if (listIndex === -1) return;

			const [list] = board.lists.splice(listIndex, 1);
			const clampedPosition = Math.max(0, Math.min(toPosition, board.lists.length));

			board.lists.splice(clampedPosition, 0, list);
			board.lists.forEach((l, i) => {
				l.position = i;
			});
		},
		updateListName: (state, action: PayloadAction<{ boardId: string; listId: string; newName: string }>) => {
			const { boardId, listId, newName } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				const list = board.lists.find((l) => l.id === listId);
				if (list) {
					list.name = newName;
				}
			}
		},

		/* Cards */
		addCard: (state, action: PayloadAction<{ boardId: string; listId: string; card: ICard }>) => {
			const { boardId, listId, card } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				const list = board.lists.find((l) => l.id === listId);
				if (list) {
					list.cards.push(card);
				}
			}
		},
		deleteCard: (state, action: PayloadAction<{ boardId: string; listId: string; cardId: string }>) => {
			const { boardId, listId, cardId } = action.payload;
			const board = state.boards.find((b) => b.id === boardId);
			if (board) {
				const list = board.lists.find((l) => l.id === listId);
				if (list) {
					list.cards = list.cards.filter((card) => card.id !== cardId);
				}
			}
		},
		moveCard: (state, action: PayloadAction<{ boardId: string; fromListId: string; toListId: string; cardId: string; toPosition: number }>) => {
			const { boardId, fromListId, toListId, cardId, toPosition } = action.payload;

			const board = state.boards.find(b => b.id === boardId);
			if (!board) return;

			const sourceList = board.lists.find(l => l.id === fromListId);
			const targetList = board.lists.find(l => l.id === toListId);
			if (!sourceList || !targetList) return;

			const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
			if (cardIndex === -1) return;

			const [card] = sourceList.cards.splice(cardIndex, 1);
			sourceList.cards
				.sort((a, b) => a.position - b.position)
				.forEach((c, i) => (c.position = i));

			const clampedPosition = Math.max(
				0,
				Math.min(toPosition, targetList.cards.length)
			);

			card.position = clampedPosition;
			targetList.cards.splice(clampedPosition, 0, card);

			targetList.cards
				.sort((a, b) => a.position - b.position)
				.forEach((c, i) => (c.position = i));
		},
		updateCard: (state, action: PayloadAction<{
			boardId: string;
			listId: string;
			cardId: string;
			updates: Partial<Pick<ICard, 'dueDate' | 'title' | 'description' | 'members' | 'status'>>
		}>) => {
			const { boardId, listId, cardId, updates } = action.payload;
			const board = state.boards.find(b => b.id === boardId);
			if (board) {
				const list = board.lists.find(l => l.id === listId);
				if (list) {
					const card = list.cards.find(c => c.id === cardId);
					if (card) {
						if (updates.title !== undefined) card.title = updates.title;
						if (updates.description !== undefined) card.description = updates.description;
						if (updates.dueDate !== undefined) card.dueDate = updates.dueDate;
						if (updates.members !== undefined) card.members = updates.members;
						if (updates.status !== undefined) card.status = updates.status;
					}
				}
			}
		},
	},
});

export const {
	setProject,
	updateProjectName,
	clearProject,
	updateBoardMemberRole,
	updateDiscordChannelId,
	removeProjectMember,
	addProjectMember,
	updateProjectMember,
	addCardMember,
	removeCardMember,
	addBoard,
	updateBoard,
	deleteBoard,
	addList,
	deleteList,
	listMove,
	updateListName,
	addCard,
	deleteCard,
	updateCard,
	moveCard,
	setProjectId
} = projectSlice.actions;


export default projectSlice.reducer;
