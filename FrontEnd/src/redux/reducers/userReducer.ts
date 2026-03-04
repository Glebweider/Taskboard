import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IUserState {
	id: string;
	username: string;
	avatar: string;
	projects: string[];
	isAuth: boolean;
}

const initialState: IUserState = {
	id: '',
	username: '',
	avatar: '',
	projects: [],
	isAuth: false,
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<IUserState>) => {
			state.id = action.payload.id;
			state.username = action.payload.username;
			state.avatar = action.payload.avatar;
			state.projects = action.payload.projects;
			state.isAuth = action.payload.isAuth;
		},
	},
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;