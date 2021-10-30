import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { LikeRequest, SaveRequest, FollowRequest, NewSongRecommendationRequest } from '../types/InteractionService_pb';
import { Empty } from '../types/Empty_pb';
import logger from '../utils/Logger';
import InteractionService from '../services/InteractionService';
import CoreServiceError from '../utils/Error';
import { ITokenData } from '../interfaces';

export interface IInteractionController {
    like(call: ServerUnaryCall<LikeRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
    save(call: ServerUnaryCall<SaveRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
    follow(call: ServerUnaryCall<FollowRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
    newSongRecommendation(
        call: ServerUnaryCall<NewSongRecommendationRequest & ITokenData>,
        callback: sendUnaryData<Empty>
    ): Promise<any>;
}
// TODO: move validation logic away from controller
// controller shall not create parameter object by checking incoming data

export class InteractionController implements IInteractionController {
    async like(call: ServerUnaryCall<LikeRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Like call');
        const { request } = call;
        const userId = request.userId;
        const res = new Empty();

        try {
            if (!request.hasPostid() && !request.hasSongrecommendationid() && !request.hasEventid()) {
                throw new CoreServiceError({ message: 'Missing id', code: status.INVALID_ARGUMENT });
            }
            await InteractionService.toggleLike({
                userId,
                postId: request.hasPostid() ? request.getPostid() : undefined,
                songRecommendationId: request.hasSongrecommendationid() ? request.getSongrecommendationid() : undefined,
                eventId: request.hasEventid() ? request.getEventid() : undefined,
            });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async save(call: ServerUnaryCall<SaveRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Save call');
        const { request } = call;
        const userId = request.userId;
        const res = new Empty();

        try {
            if (
                !request.hasPostid() &&
                !request.hasSongrecommendationid() &&
                !request.hasHighlightedpostid() &&
                !request.hasEventid()
            ) {
                throw new CoreServiceError({ message: 'Missing id', code: status.INVALID_ARGUMENT });
            }
            await InteractionService.toggleSave({
                userId,
                postId: request.hasPostid() ? request.getPostid() : undefined,
                songRecommendationId: request.hasSongrecommendationid() ? request.getSongrecommendationid() : undefined,
                highlightedPostId: request.hasHighlightedpostid() ? request.getHighlightedpostid() : undefined,
                eventId: request.hasEventid() ? request.getEventid() : undefined,
            });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async follow(call: ServerUnaryCall<FollowRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Follow call');
        const { request } = call;
        const userId = request.userId;
        const res = new Empty();

        try {
            if (!request.hasPlaceid()) {
                throw new CoreServiceError({ message: 'Missing id', code: status.INVALID_ARGUMENT });
            }
            await InteractionService.toggleFollow({ userId, placeId: request.getPlaceid() });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async newSongRecommendation(
        call: ServerUnaryCall<NewSongRecommendationRequest & ITokenData>,
        callback: sendUnaryData<Empty>
    ): Promise<any> {
        logger.info('New song recommendation');
        const res = new Empty();
        const { request } = call;
        const userId = request.userId;

        try {
            if (!request.hasPlaceid()) {
                throw new CoreServiceError({ message: 'Missing id', code: status.INVALID_ARGUMENT });
            }
            const songId = request.getSongid();
            await InteractionService.insertSongRecommendation({ userId, songId, placeId: request.getPlaceid() });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
