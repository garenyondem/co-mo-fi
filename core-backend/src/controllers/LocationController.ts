import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { Empty } from '../types/Empty_pb';
import logger from '../utils/Logger';
import { UpdateRequest } from '../types/LocationService_pb';
import LocationService from '../services/LocationService';
import CoreServiceError from '../utils/Error';
import { ITokenData } from '../interfaces';

export interface ILocationController {
    update(call: ServerUnaryCall<UpdateRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
}

export class LocationController implements ILocationController {
    async update(call: ServerUnaryCall<UpdateRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Location update');
        const res = new Empty();
        const { request } = call;
        const userId = request.userId;
        const userLocation = request.getPoint();

        try {
            if (userLocation === undefined) {
                throw new CoreServiceError({ message: 'Missing location data', code: status.INVALID_ARGUMENT });
            }
            const locationParams = {
                userId,
                point: userLocation.toObject(),
            };
            await Promise.all([
                LocationService.updateUserLocation(locationParams),
                LocationService.insertLocationHistory(locationParams),
            ]);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
