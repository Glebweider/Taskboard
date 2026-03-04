import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import App from "./App";
import { AlertProvider } from "@Components/Alert/context";
import store from "@Redux/store";
import "@Styles/index.scss";


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
	<Provider store={store}>
		<BrowserRouter>
			<DndProvider backend={HTML5Backend}>
				<AlertProvider>
					<App />
				</AlertProvider>
			</DndProvider>
		</BrowserRouter>
	</Provider>
);
