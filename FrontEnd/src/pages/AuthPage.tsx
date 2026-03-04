import styles from '@Styles/pages/AuthPage.module.scss';
import AuthFunc from '@Utils/Auth';


const AuthPage = () => {
	return (
		<div className={styles.app}>
			<img className={styles.logo} src='./logo.png' />
			<div className={styles.container}>
				<button onClick={AuthFunc}>
					<img src='./icons/Discord.svg' />
					<a>Log in with</a>					
				</button>
			</div>
		</div>
	);
};

export default AuthPage;
