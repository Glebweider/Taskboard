import { useAlert } from "@Components/Alert/context";


export const useGetMyTasks = () => {
    const { showAlert } = useAlert();

    const getMyTasks = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URI}/user/my-tasks`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showAlert(`Server error: ${response.status}, ${data.message?.message}`);
                return [];
            }

            return data;
        } catch (error) {
            showAlert(`Fetch failed: ${error}`);
            return [];
        }
    };

    return { getMyTasks };
};