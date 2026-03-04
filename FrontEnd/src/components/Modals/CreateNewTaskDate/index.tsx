/* eslint-disable prefer-const */
import { useEffect, useState } from 'react';

import style from './CreateNewTaskDate.module.scss';


interface CreateNewTaskDateProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newDate: Date | null) => void;
    selectedDate: Date | null
    setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CreateNewTaskDate: React.FC<CreateNewTaskDateProps> = ({
    isOpen,
    onClose,
    onSave,
    selectedDate,
    setSelectedDate
}) => {
    const [date, setDate] = useState(new Date());
    const [selected, setSelected] = useState(new Date());
    const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
    const [time, setTime] = useState("12:00");


    useEffect(() => {
        if (!isOpen) return;

        if (selectedDate) {
            const initialDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

            setSelected(initialDate);

            const hours = initialDate.getHours();
            const minutes = initialDate.getMinutes();

            const isPM = hours >= 12;
            const normalizedHours = hours % 12 || 12;

            setAmpm(isPM ? "PM" : "AM");
            setTime(`${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
            setDate(initialDate);
        } else {
            const now = new Date();
            setSelected(now);
            setTime("12:00");
            setAmpm("AM");
            setDate(now);
        }
    }, [isOpen, selectedDate]);

    const today = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const prevMonth = () => setDate(new Date(year, month - 1, 1));
    const nextMonth = () => setDate(new Date(year, month + 1, 1));

    const updateFullDateTime = (timeValue: string, selectedDay: Date = selected, overrideAmpm?: "AM" | "PM") => {
        if (!timeValue) return;

        let [hours, minutes] = timeValue.split(":").map(Number);
        const currentAmpm = overrideAmpm ?? ampm;

        if (currentAmpm === "PM" && hours < 12) hours += 12;
        if (currentAmpm === "AM" && hours === 12) hours = 0;

        const updated = new Date(
            selectedDay.getFullYear(),
            selectedDay.getMonth(),
            selectedDay.getDate(),
            hours,
            minutes,
            0,
            0
        );

        setSelectedDate(updated);
    };

    const selectDay = (day: number) => {
        const newSelected = new Date(year, month, day);

        const isSameAsSelected =
            selected.getDate() === day &&
            selected.getMonth() === month &&
            selected.getFullYear() === year;

        const isToday =
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

        if (isSameAsSelected && isToday) {
            setSelectedDate(null);
            setSelected(new Date());
            return;
        }

        setSelected(newSelected);
        updateFullDateTime(time, newSelected);
    };

    const rangeStart = new Date(Math.min(today.getTime(), selected.getTime()));
    const rangeEnd = new Date(Math.max(today.getTime(), selected.getTime()));

    if (!isOpen) return null;

    return (
        <div className="modalOverlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                    onSave(selectedDate);
                }
            }}>
            <div
                className={style.modalContent}
                onMouseDown={(e) => e.stopPropagation()}>
                <div className={style.modalContentContainer}>
                    <span>Set deadlines</span>

                    <div className={style.picker}>
                        <div className={style.header}>
                            <button onClick={prevMonth}>
                                <svg style={{ transform: "rotate(180deg)" }} width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M11.4 7.86793L9.92251 6.39043L7.51501 3.98293C7.00501 3.48043 6.13501 3.84043 6.13501 4.56043V9.23293V13.4404C6.13501 14.1604 7.00501 14.5204 7.51501 14.0104L11.4 10.1254C12.0225 9.51043 12.0225 8.49043 11.4 7.86793Z" fill="#D4D4D4" />
                                </svg>
                            </button>
                            <span>{months[month]} {year}</span>
                            <button onClick={nextMonth}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M11.4 7.86793L9.92251 6.39043L7.51501 3.98293C7.00501 3.48043 6.13501 3.84043 6.13501 4.56043V9.23293V13.4404C6.13501 14.1604 7.00501 14.5204 7.51501 14.0104L11.4 10.1254C12.0225 9.51043 12.0225 8.49043 11.4 7.86793Z" fill="#D4D4D4" />
                                </svg>
                            </button>
                        </div>

                        <div className={style.weekdays}>
                            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <span key={d}>{d}</span>)}
                        </div>

                        <div className={style.days}>
                            {Array(firstDay).fill(0).map((_, i) => (
                                <span key={"e" + i} className={style.empty}></span>
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const thisDate = new Date(year, month, day);
                                const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                                const isSelected =
                                    selected.getDate() === day &&
                                    selected.getMonth() === month &&
                                    selected.getFullYear() === year;

                                const isToday =
                                    today.getDate() === day &&
                                    today.getMonth() === month &&
                                    today.getFullYear() === year;

                                const isInRange = thisDate.getTime() >= rangeStart.setHours(0, 0, 0, 0) &&
                                    thisDate.getTime() <= rangeEnd.setHours(23, 59, 59, 999);

                                const classes = [
                                    isInRange ? style.inRange : null,
                                    isSelected ? style.selected : null,
                                    isToday ? style.today : null,
                                    isPast ? style.disabledDay : null
                                ].filter(Boolean).join(" ");

                                return (
                                    <span
                                        key={day}
                                        className={classes || undefined}
                                        onClick={() => !isPast && selectDay(day)}
                                        aria-current={isToday ? "date" : undefined}>
                                        {day}
                                    </span>
                                );
                            })}

                        </div>

                        <div className={style.timeBlock}>
                            <span>Time</span>
                            <div className={style.timeInput}>
                                <input
                                    type="time"
                                    step="60"
                                    min="00:00"
                                    max="12:59"
                                    value={time}
                                    onChange={(e) => {
                                        setTime(e.target.value);
                                        updateFullDateTime(e.target.value);
                                    }}
                                />
                                <div className={style.ampm}>
                                    <button
                                        onClick={() => {
                                            const newAmpm: "AM" | "PM" = "AM";
                                            setAmpm(newAmpm);
                                            updateFullDateTime(time, selected, newAmpm);
                                        }}
                                        className={ampm === "AM" ? style.active : ""}>
                                        AM
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newAmpm: "AM" | "PM" = "PM";
                                            setAmpm(newAmpm);
                                            updateFullDateTime(time, selected, newAmpm);
                                        }}
                                        className={ampm === "PM" ? style.active : ""}>
                                        PM
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
};

export default CreateNewTaskDate;