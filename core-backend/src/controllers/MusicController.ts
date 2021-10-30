import { sendUnaryData, ServerUnaryCall } from 'grpc';
import logger from '../utils/Logger';
import { AvailableGenresRequest, AvailableGenresResponse } from '../types/MusicService_pb';
import MusicService from '../services/MusicService';

export interface IMusicController {
    availableGenres(
        call: ServerUnaryCall<AvailableGenresRequest>,
        callback: sendUnaryData<AvailableGenresResponse>
    ): Promise<any>;
}

export class MusicController implements IMusicController {
    async availableGenres(
        call: ServerUnaryCall<AvailableGenresRequest>,
        callback: sendUnaryData<AvailableGenresResponse>
    ): Promise<any> {
        logger.info('Available genres');
        const res = new AvailableGenresResponse();
        try {
            const genres = await MusicService.getAvailableGenres();
            res.setGenresList(genres);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
