import style from './Users.module.scss';

import { Avatar } from '@Components/Avatar';
import { TASK_MEMBER_VISIBILITY } from '@Utils/constants';
import { ICard, IProject } from '@Redux/reducers/projectReducer';


interface UsersProps {
    task: ICard,
    projectState: IProject;
    className?: string;
    onClick?: () => void;
}

const Users: React.FC<UsersProps> = ({ task, projectState, className, onClick }) => {
    return (
        <div className={`${style.users} ${className ?? ''}`}
            onClick={onClick}>
            {task.members.length > TASK_MEMBER_VISIBILITY &&
                <span>+{task.members.length - TASK_MEMBER_VISIBILITY}</span>
            }
            <div className={style.avatars}>
                {task.members.slice(0, TASK_MEMBER_VISIBILITY).map(member => (
                    <Avatar
                        key={member}
                        size={22}
                        className={style.user}
                        user={projectState.members.find((m) => m.id === member)}
                    />
                ))}
            </div>
        </div>
    )
};

export default Users;
