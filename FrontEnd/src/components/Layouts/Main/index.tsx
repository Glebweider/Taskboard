import { Outlet } from 'react-router-dom';

import style from './MainLayout.module.scss';
import Navbar from '@Components/Navbar';


const MainLayout = () => {
    return (
        <div className={style.container}>
            <Navbar />
            <div className={style.content}>
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;
