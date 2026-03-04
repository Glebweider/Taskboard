import { useNavigate } from 'react-router-dom';

import style from '@Styles/pages/404Page.module.scss';


const NotFoundPage = () => {
	const navigate = useNavigate();

	return (
		<div className={style.container}>
			<div className={style.content}>
				<span style={{ fontSize: 144 }}>404</span>
				<span style={{ fontSize: 28 }}>По данному запросу ничего не найдено :(</span>
				<span style={{ fontSize: 18, marginTop: 10 }}>Если вы уверенны что здесь что-то должно быть обратитесь к
					<a href={process.env.REACT_APP_OWNER_LINK} target="_blank" rel="noopener noreferrer"> администратору сайта.</a>
				</span>
			</div>
			<div className={style.messageContainer} onClick={() => navigate(-1)}>
				<div className={style.messageBox}>
					<p className={style.messageText}>Вернуться назад</p>
				</div>
			</div>
		</div>
	);
};

export default NotFoundPage;
