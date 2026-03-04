import { Route, Routes } from "react-router-dom";

//Pages
import CallbackPage from "./pages/CallbackPage";
import NotFoundPage from "./pages/404Page";
import LandingPage from "./pages/LandingPage";
import TasksPage from "./pages/TasksPage";
import ProjectsPage from "./pages/ProjectsPage";
import AuthPage from "./pages/AuthPage";

//Components
import ProtectedAuthRoute from "@Components/ProtectedAuthRoute";
import MainLayout from "@Components/Layouts/Main";


function App() {
	return (
		<Routes>
			<Route
				path='/'
				element={<LandingPage />} />
			<Route element={<ProtectedAuthRoute> <MainLayout /> </ProtectedAuthRoute>}>
				<Route path="/tasks" element={<TasksPage />} />
				<Route path="/projects" element={<ProjectsPage />} />
			</Route>
			<Route
				path='/callback'
				element={<CallbackPage />} />
			<Route
				path='/auth'
				element={<AuthPage />} />
			<Route
				path='*'
				element={<NotFoundPage />} />
		</Routes>
	);
}

export default App;
