interface Array<T> {
    /**
     * Run array of async operations sequentially
     */
    asyncForEach(this: any[], callback: Function): Promise<any>;
}

Array.prototype.asyncForEach = async function(this: any[], callback: Function): Promise<any> {
    for (let i = 0, length = this.length; i < length; i++) {
        await callback(this[i], i, this);
    }
};
