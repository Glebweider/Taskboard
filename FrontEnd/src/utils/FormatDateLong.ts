export function formatDateLong(dateInput: string | Date): string {
    const date = typeof dateInput === 'string'
        ? new Date(dateInput)
        : dateInput;

    return new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}
