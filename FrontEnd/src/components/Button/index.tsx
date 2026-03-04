

import styles from './CustomButton.module.scss';


interface CustomButtonProps {
    style?: React.CSSProperties;
    className?: string;
    type: 'Asign' | 'Cancel';
    disabled?: boolean;
    onClick: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({ style, className, type, disabled, onClick }) => {
    return (
        <button
            className={`
                ${styles.container} 
                ${type == 'Asign' ? styles.asign : styles.cancel} 
                ${className}
            `}
            style={style}
            disabled={disabled}
            onClick={onClick}>
            {type}
        </button>
    )
};

export default CustomButton;
