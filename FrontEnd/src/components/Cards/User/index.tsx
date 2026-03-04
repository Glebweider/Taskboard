import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './UserCard.module.scss';
import { IUserProject } from "@Redux/reducers/projectReducer";
import { Avatar } from '@Components/Avatar';
import UserSettingsMenu from '@Components/Menus/UserSettings';
import { RootState } from '@Redux/store';


interface UserCardProps {
    member: IUserProject;
    permission: boolean;
    selectedUserId: string;
    setSelectedUserId: React.Dispatch<React.SetStateAction<string>>;
}

const UserCard: React.FC<UserCardProps> = ({ member, permission, selectedUserId, setSelectedUserId }) => {
    const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);

    const userState = useSelector((state: RootState) => state.userReducer);
    const projectState = useSelector((state: RootState) => state.projectReducer);

    useEffect(() => {
        if (selectedUserId != member.id)
            setIsOpenMenu(false);
    }, [isOpenMenu, selectedUserId]);


    return (
        <>
            <div className={style.container}>
                <div className={style.content}>
                    <Avatar className={style.avatar} size={46} user={member} />
                    <div className={style.dataContainer}>
                        <span>{member.displayName ? member.displayName : member.name}</span>
                        {member.description &&
                            <text>{member.description}</text>
                        }
                    </div>
                </div>
                {permission && userState.id != member.id && projectState.ownerId != member.id &&
                    <img
                        className={`${style.buttonEdit} settingsBtn`}
                        onClick={() =>{ 
                            setIsOpenMenu(!isOpenMenu);
                            setSelectedUserId(member.id);
                        }}
                        src='./icons/Settings.svg' />
                }
                <UserSettingsMenu
                    isOpen={isOpenMenu}
                    member={member}
                    onClose={() => setIsOpenMenu(false)} />
            </div>
        </>
    );
};

export default UserCard;
