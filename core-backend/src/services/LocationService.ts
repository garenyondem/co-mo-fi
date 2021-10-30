import { Point } from '../types/Point_pb';
import { UserModel } from '../models/User';
import { ClientLocationHistoryModel } from '../models/ClientLocationHistory';

class LocationService {
    async updateUserLocation(options: { userId: string; point: Point.AsObject }) {
        const userId = options.userId.toObjectId();
        const point = {
            location: {
                coordinates: [options.point.lon, options.point.lat],
            },
        };
        return UserModel.findByIdAndUpdate(userId, point);
    }
    // We may need to separate this to a LocationHistoryService in the future
    async insertLocationHistory(options: { userId: string; point: Point.AsObject }) {
        const locationHistory = new ClientLocationHistoryModel();
        locationHistory.userId = options.userId.toObjectId();
        locationHistory.location.coordinates = [options.point.lon, options.point.lat];
        return locationHistory.save();
    }
}

export default new LocationService();
