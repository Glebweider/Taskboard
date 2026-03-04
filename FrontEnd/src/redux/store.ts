import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/userReducer';
import projectReducer from './reducers/projectReducer';
import projectsReducer from './reducers/projectsReducer';

const store = configureStore({
	reducer: {
		userReducer,
		projectReducer,
		projectsReducer
	}
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
