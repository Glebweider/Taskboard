import style from './CloseButton.module.scss'


interface CloseButtonProps {
    onClose: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => {
    return (
        <svg
            className={style.button}
            onClick={onClose}
            width="42"
            height="42"
            viewBox="0 0 42 42"
            fill="none">
            <rect x="0.5" y="0.5" width="41" height="41" rx="20.5" stroke="#D4D4D4" />
            <line x1="13" y1="28.2939" x2="28.2958" y2="12.9981" strokeLinecap="round" />
            <line x1="13.7071" y1="12.998" x2="29.0029" y2="28.2938" strokeLinecap="round" />
        </svg>
    )
};

export default CloseButton;
