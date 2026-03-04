import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import styles from '@Styles/pages/LandingPage.module.scss';


const slides = [
	{
		title: "Plan-line: Your next generation task manager",
		text: "Manage tasks, projects, and ideas effortlessly. Collaborate with your team in real time.",
		image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
	},
	{
		title: "Seamless Discord Integration",
		text: "Connect your Plan-line workspace to Discord to get instant updates and manage tasks directly from your channels.",
		image: "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80"
	},
	{
		title: "Smart boards & analytics",
		text: "Organize your workflow with Kanban boards and get insightful analytics to track your team's performance.",
		image: "https://media.gettyimages.com/id/1496883078/photo/business-people-smart-board-and-analytics-in-meeting-for-corporate-data-graph-or-charts-at.jpg?s=1024x1024&w=gi&k=20&c=Nu11CGB3xUW6_HX3QWBqmEI_pexgy-TQaH3vuwKVXyc="
	}
];

const LandingPage = () => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [direction, setDirection] = useState<'left' | 'right'>('left');
	const [isFooterOpen, setFooterOpen] = useState(false);
	const navigate = useNavigate();

	const handleNext = () => {
		if (currentSlide < slides.length - 1) {
			setDirection('left');
			setCurrentSlide(prev => prev + 1);
		}
	};

	const handlePrev = () => {
		if (currentSlide > 0) {
			setDirection('right');
			setCurrentSlide(prev => prev - 1);
		}
	};

	return (
		<div className={styles.app}>
			<header className={styles.header}>
				<div className={styles.logoContainer}>
					<img className={styles.logo} src='./logo.png' />
					<h1>Plan-line</h1>
				</div>
				<nav className={styles.nav}>
					{/* <a href="#about">About</a>
					<a href="#features">Features</a>
					<a href="#contact">Contact</a> */}
					<div className={`${styles.authInNavbar} ${currentSlide > 0 ? styles.show : ''}`}>
						<button className={styles.authButtonSmall} onClick={() => navigate('auth')}>
							Auth with Discord
						</button>
					</div>
				</nav>
			</header>

			<main className={styles.main}>
				<div
					key={currentSlide}
					className={`${styles.slide} ${direction === 'left' ? styles.slideLeft : styles.slideRight}`}>

					<img src={slides[currentSlide].image} alt="Slide visual" className={styles.slideImage} />
					<h2 className={styles.dataTitle}>{slides[currentSlide].title}</h2>
					<p className={styles.dataInfo}>{slides[currentSlide].text}</p>

					<div className={styles.pagination}>
						{slides.map((_, index) => (
							<span
								key={index}
								className={`${styles.dot} ${index === currentSlide ? styles.active : ''}`}
								onClick={() => {
									setDirection(index > currentSlide ? 'left' : 'right');
									setCurrentSlide(index);
								}}>
							</span>
						))}
					</div>

					{currentSlide === 0 && (
						<button className={styles.authButton} onClick={() => navigate('auth')}>
							Auth with Discord
						</button>
					)}

					<div className={styles.controls}>
						<button className={styles.controlButton} onClick={handlePrev} disabled={currentSlide === 0}>
							Prev
						</button>
						<button
							className={styles.controlButton}
							onClick={handleNext}
							disabled={currentSlide === slides.length - 1}>
							Next
						</button>
					</div>
				</div>
			</main>

			<div
				className={`${styles.footerTab} ${isFooterOpen ? styles.open : ''}`}
				onClick={() => setFooterOpen(!isFooterOpen)}>
				{isFooterOpen ? (
					<div className={styles.footerContent}>
						&copy; {new Date().getFullYear()} Plan-line. All rights reserved.<br />
						support@plan-line.app
					</div>
				) : (
					<span>ⓘ Info</span>
				)}
			</div>
		</div>
	);
};

export default LandingPage;
