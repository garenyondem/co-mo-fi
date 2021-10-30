interface Number {
    /**
     * Convert unix time to Date object
     */
    toDate(this: Number): Date;
}

Number.prototype.toDate = function (this: Number): Date {
    return new Date(+this * 1000);
};
