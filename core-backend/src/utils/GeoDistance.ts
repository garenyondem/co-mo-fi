const radiusUnits: { [key: string]: number } = {
    feet: 20908800,
    yards: 6969600,
    miles: 3960,
    mi: 3960,
    kilometers: 6371,
    km: 6371,
    meters: 6371000,
};
function getDistance(
    start: number[] | { lat: number; lon: number },
    end: number[] | { lat: number; lon: number },
    options: { unit: string } = { unit: '' }
): number {
    const [lat1, lon1] = parseCoordinates(start);
    const [lat2, lon2] = parseCoordinates(end);

    const earthRadius = getEarthRadius(options.unit);

    const latDelta = ((lat2 - lat1) * Math.PI) / 180;
    const lonDelta = ((lon2 - lon1) * Math.PI) / 180;

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const a =
        Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let distance = earthRadius * c;
    distance = Math.round(distance * 10) / 10;

    return distance;
}

function parseCoordinates(point: number[] | { lat: number; lon: number }) {
    let coords = [0, 0];
    if (point instanceof Array) {
        coords = point;
    } else if (point.lat && point.lon) {
        coords = [point.lat, point.lon];
    }
    return coords;
}

function getEarthRadius(unit: string) {
    unit = unit.toLowerCase();
    return radiusUnits[unit] || radiusUnits['km'];
}

export default getDistance;
