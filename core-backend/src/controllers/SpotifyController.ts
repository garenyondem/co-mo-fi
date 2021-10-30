import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { Empty } from '../types/Empty_pb';
import { AuthorizeResponse, SearchRequest, SearchResponse } from '../types/SpotifyService_pb';
import logger from '../utils/Logger';
import config from '../config';
import SpotifyService from '../services/SpotifyService';
import UserService from '../services/UserService';
import { ITokenData } from '../interfaces';

export interface ISpotifyController {
    authorize(call: ServerUnaryCall<Empty>, callback: sendUnaryData<AuthorizeResponse>): Promise<any>;
    search(call: ServerUnaryCall<SearchRequest & ITokenData>, callback: sendUnaryData<SearchResponse>): Promise<any>;
    disconnect(call: ServerUnaryCall<Empty & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
}
export class SpotifyController implements ISpotifyController {
    constructor() {}

    async authorize(call: ServerUnaryCall<Empty>, callback: sendUnaryData<AuthorizeResponse>): Promise<any> {
        const res = new AuthorizeResponse();
        logger.info('Spotify authorization');
        res.setUrl(config.spotifyAuthenticationUrl);
        return callback(null, res);
    }
    async search(
        call: ServerUnaryCall<SearchRequest & ITokenData>,
        callback: sendUnaryData<SearchResponse>
    ): Promise<any> {
        logger.info('Spotify search');
        const res = new SearchResponse();
        const { request } = call;
        const userId = request.userId;
        try {
            const text = request.getText();
            const songSearchResult = await SpotifyService.searchForSongRecommendation({ userId, text });
            res.setSongsList(songSearchResult);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async disconnect(call: ServerUnaryCall<Empty & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Spotify disconnect');
        const res = new Empty();
        const { request } = call;
        const userId = request.userId;
        try {
            await Promise.all([SpotifyService.disconnect({ userId }), UserService.removeSpotifyUrl({ userId })]);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
