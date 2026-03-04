import { useSelector } from 'react-redux';

import style from './Avatar.module.scss';
import { RootState } from '@Redux/store';


type IProfileAvatarIconProps = {
	size: number;
	func?: React.Dispatch<React.SetStateAction<boolean>>;
	user?: any;
	className?: string; 
};

export function Avatar({ size, func, user, className }: IProfileAvatarIconProps): JSX.Element {
	const userFromStore = useSelector((state: RootState) => state.userReducer);

	const resolvedUser = user || userFromStore;

	const handleClick = () => {
		if (func) {
			func((prev) => !prev);
		}
	};

	return (
		<img
			className={`${style.avatar} ${className || ''}`}
			onClick={handleClick}
			src={`https://cdn.discordapp.com/avatars/${resolvedUser.id}/${resolvedUser.avatar}?size=512`}
			width={size}
			height={size}
			alt={`${resolvedUser.username} avatar`}/>
	);
}

