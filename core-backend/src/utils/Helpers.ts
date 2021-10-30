import { DISTANCE_UNITS } from './Enums';

export function getDistanceUnitByLocale(locale: string) {
    const mileCountries = ['en_US', 'en_GB'];
    if (mileCountries.some((x) => x === locale)) {
        return DISTANCE_UNITS.IMPERIAL;
    } else {
        return DISTANCE_UNITS.METRIC;
    }
}

function snakeToCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}

// Nested objects do not get converted
export function mapToCamelCaseObject<T>(val: { [key: string]: any } | any): T {
    for (let key in val) {
        const camelCaseKey = snakeToCamelCase(key);
        val[camelCaseKey] = val[key];
        camelCaseKey != key && delete val[key];
    }
    return val;
}

/**
 * @param peer - in form of ipv4:127.0.0.1:50321
 */
export function mapClientConnectionData(peer: string) {
    const chunks = peer.split(':');
    return {
        protocol: chunks[0],
        ip: chunks[1],
        port: chunks[2],
    };
}

export function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}
