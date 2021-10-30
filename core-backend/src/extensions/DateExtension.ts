interface Date {
    /**
     * Convert date to elapsed time string
     * - 5 min or 10 hrs
     */
    toElapsedTimeString(this: Date): string;
    /**
     * Convert date to unix time
     */
    toUnixTimestamp(this: Date): number;
}

Date.prototype.toElapsedTimeString = function(this: Date): string {
    const now = new Date();
    const diff = +now - +this;
    const delta = Math.round(diff / 1000);
    const minute = 60,
        hour = minute * 60,
        day = hour * 24,
        week = day * 7,
        month = day * 28,
        year = week * 52;

    const elapsedTime =
        (delta < 30 && 'now') ||
        (delta < minute && `${delta}s ago`) ||
        (delta < hour && `${Math.floor(delta / minute)}m ago`) ||
        (delta < day && `${Math.floor(delta / hour)}h ago`) ||
        (delta < week && `${Math.floor(delta / day)}d ago`) ||
        (delta < month && `${Math.floor(delta / week)}w ago`) ||
        (delta < year && `${Math.floor(delta / month)}mo ago`) ||
        `${Math.floor(delta / year)}y ago`;

    return elapsedTime;
};

Date.prototype.toUnixTimestamp = function(this: Date): number {
    return Math.floor(this.getTime() / 1000);
};
