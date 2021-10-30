function snakeToCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}

// Nested objects do not get converted
export function mapToCamelCaseObject(val: { [key: string]: any } | any): object {
    for (let key in val) {
        const camelCaseKey = snakeToCamelCase(key);
        val[camelCaseKey] = val[key];
        camelCaseKey != key && delete val[key];
    }
    return val;
}
