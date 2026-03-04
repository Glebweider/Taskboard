/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { setUser } from '@Redux/reducers/userReducer';
import { RootState } from '@Redux/store';
import { useAlert } from '@Components/Alert/context';


type ProtectedRouteProps = {
	children: React.ReactNode;
};

const ProtectedAuthRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { showAlert } = useAlert();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);

	const { isAuth } = useSelector((state: RootState) => state.userReducer);

	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const inviteId = searchParams.get('inviteId');
	const inviteName = searchParams.get('inviteName');
	const projectId = searchParams.get('projectId');


	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		if (isAuth) {
			setIsAuthenticated(true);
			return;
		}

		try {
			if (inviteId)
				localStorage.setItem('inviteId', inviteId);
			if (inviteName)
				localStorage.setItem('inviteName', inviteName);
			if (projectId)
				localStorage.setItem('projectId', projectId);

			navigate(location.pathname + location.search, { replace: true });

			const response = await fetch(`${process.env.REACT_APP_BACKEND_URI}/auth/`,
				{ credentials: 'include' }
			);

			if (response.ok) {
				const data = await response.json();
				dispatch(setUser({
					id: data.discordId,
					username: data.username,
					avatar: data.avatar,
					projects: data.projects,
					isAuth: true,
				}));

				setIsAuthenticated(true);
			} else {
				setIsAuthenticated(false);
				navigate('/auth');
			}
		} catch (error) {
			showAlert(`Ошибка при проверке токена: ${error}`);
			setIsAuthenticated(false);
			navigate('/');
		}
	};

	if (isAuthenticated === null) {
		return (<></>);
	}

	return isAuthenticated ? <>{children}</> : <div></div>;
};

export default ProtectedAuthRoute;