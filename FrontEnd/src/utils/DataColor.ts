export const getDueDateColor = (dueDate?: Date | string) => {
    if (!dueDate) return '';

    const now = new Date();
    const end = new Date(dueDate);

    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) return 'red';
    if (diffDays === 2) return 'orange';
    return 'green';
};
