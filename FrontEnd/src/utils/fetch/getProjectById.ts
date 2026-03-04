import { useDispatch } from "react-redux";

import { useAlert } from "@Components/Alert/context";
import { setProject } from "@Redux/reducers/projectReducer";


export const useGetProject = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();

    const getProject = async (projectId: string) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/projects/${projectId}`,
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

            dispatch(setProject(data));
        } catch (error) {
            showAlert(`Fetch failed: ${error}`);
        }
    };

    return { getProject };
};