export function isValidFutureDate(isoDate: string): boolean {
    const dueDateTimestamp = Math.floor(new Date(isoDate).getTime() / 1000)
    const now = Math.floor(Date.now() / 1000)
    return dueDateTimestamp > now + 24 * 60 * 60
}

export function getIsoDateFromTimestamp(timestamp: number): string {
    return new Date(Number(timestamp) * 1000).toISOString().slice(0, 10)
}

export function getTimestampFromIsoDate(isoDate: string): number {
    return Math.floor(new Date(isoDate).getTime() / 1000)
}
