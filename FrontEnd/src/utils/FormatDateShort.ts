export function formatDateShort(dateInput: string | Date): string {
    const date = typeof dateInput === 'string'
        ? new Date(dateInput)
        : dateInput;

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}.${month}.${year}`;
}
