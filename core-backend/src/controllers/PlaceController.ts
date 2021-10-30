import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import {
    RecommendationsResponse,
    RecommendationsRequest,
    FilterRequest,
    FilterResponse,
    SongRecommendationsRequest,
    SongRecommendationsResponse,
    PlaceDetailsRequest,
    PlaceDetailsResponse,
    EditPlaceDetailsRequest,
    EditPlaceDetailsResponse,
    CreatePlaceRequest,
    CreatePlaceResponse,
} from './../types/PlacesService_pb';
import logger from '../utils/Logger';
import PlaceService from '../services/PlaceService';
import CoreServiceError from '../utils/Error';
import { Validator } from 'node-input-validator';
import { find } from 'lodash';
import { ITokenData } from '../interfaces';

export interface IPlaceController {
    recommendations(
        call: ServerUnaryCall<RecommendationsRequest & ITokenData>,
        callback: sendUnaryData<RecommendationsResponse>
    ): Promise<any>;
    filter(call: ServerUnaryCall<FilterRequest & ITokenData>, callback: sendUnaryData<FilterResponse>): Promise<any>;
    songRecommendations(
        call: ServerUnaryCall<SongRecommendationsRequest & ITokenData>,
        callback: sendUnaryData<SongRecommendationsResponse>
    ): void;
    placeDetails(
        call: ServerUnaryCall<PlaceDetailsRequest & ITokenData>,
        callback: sendUnaryData<PlaceDetailsResponse>
    ): Promise<any>;
    editPlaceDetails(
        call: ServerUnaryCall<EditPlaceDetailsRequest & ITokenData>,
        callback: sendUnaryData<EditPlaceDetailsResponse>
    ): Promise<any>;
    createPlace(
        call: ServerUnaryCall<CreatePlaceRequest & ITokenData>,
        callback: sendUnaryData<CreatePlaceResponse>
    ): Promise<any>;
}

export class PlaceController implements IPlaceController {
    constructor() {}

    async recommendations(
        call: ServerUnaryCall<RecommendationsRequest & ITokenData>,
        callback: sendUnaryData<RecommendationsResponse>
    ): Promise<any> {
        logger.info('Place recommendations');
        const res = new RecommendationsResponse();
        const { request } = call;
        const userId = request.userId;
        const point = request.getPoint();
        try {
            if (!point || !point.getLat() || !point.getLon()) {
                throw new CoreServiceError({ message: 'Missing location', code: status.INVALID_ARGUMENT });
            }
            const places = await PlaceService.getPlaceRecommendations({ userId, point: point.toObject() });
            res.setPlacesList(places);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async filter(
        call: ServerUnaryCall<FilterRequest & ITokenData>,
        callback: sendUnaryData<FilterResponse>
    ): Promise<any> {
        logger.info('Place filter');
        const res = new FilterResponse();
        const { request } = call;
        const userId = request.userId;
        const point = request.getPoint();
        try {
            if (!point || !point.getLat() || !point.getLon()) {
                throw new CoreServiceError({ message: 'Missing location', code: status.INVALID_ARGUMENT });
            }
            const places = await PlaceService.searchPlaces({
                userId,
                text: request.getText(),
                point: point.toObject(),
            });
            res.setPlacesList(places);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async songRecommendations(
        call: ServerUnaryCall<SongRecommendationsRequest & ITokenData>,
        callback: sendUnaryData<SongRecommendationsResponse>
    ): Promise<any> {
        logger.info('Place songrecommendations');
        const res = new SongRecommendationsResponse();
        const { request } = call;
        const userId = request.userId;

        try {
            if (!request.getPlaceid()) {
                throw new CoreServiceError({ message: 'Missing place id', code: status.INVALID_ARGUMENT });
            }
            const songRecommendations = await PlaceService.getSongRecommendationsOfPlace({
                placeId: request.getPlaceid(),
                page: request.getPage(),
                userId,
            });
            res.setSongrecommendationsList(songRecommendations);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async placeDetails(
        call: ServerUnaryCall<PlaceDetailsRequest & ITokenData>,
        callback: sendUnaryData<PlaceDetailsResponse>
    ): Promise<any> {
        logger.info('Place Details');
        const res = new PlaceDetailsResponse();
        const { request } = call;
        const userId = request.userId;

        try {
            if (!request.getPlaceid()) {
                throw new CoreServiceError({ message: 'Missing place id', code: status.INVALID_ARGUMENT });
            }
            const place = await PlaceService.getPlace({ userId, placeId: request.getPlaceid() });
            res.setPlace(place);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async editPlaceDetails(
        call: ServerUnaryCall<EditPlaceDetailsRequest & ITokenData>,
        callback: sendUnaryData<EditPlaceDetailsResponse>
    ): Promise<any> {
        logger.info('Edit place details');
        const res = new EditPlaceDetailsResponse();
        const { request } = call;
        const userId = request.userId;
        try {
            const {
                placeid,
                genreidsList,
                timeframesList,
                photosList,
                name,
                description,
                price,
                location,
                profilephoto,
            } = request.toObject();

            const updatedPlace = await PlaceService.updatePlaceDetails({
                userId,
                placeId: placeid,
                genreIds: genreidsList,
                timeframes: timeframesList,
                photos: photosList,
                name,
                description,
                price,
                location,
                profilePhoto: profilephoto,
            });
            res.setPlace(updatedPlace);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async createPlace(
        call: ServerUnaryCall<CreatePlaceRequest & ITokenData>,
        callback: sendUnaryData<CreatePlaceResponse>
    ) {
        logger.info('Create place');
        const res = new CreatePlaceResponse();
        const { request } = call;
        const userId = request.userId;

        try {
            const {
                genreidsList,
                timeframesList,
                photosList,
                name,
                description,
                price,
                location,
                profilephoto,
            } = request.toObject();

            // TODO: move input validation to separate file as interceptor
            const validation = new Validator(
                { genreidsList, timeframesList, name, location },
                {
                    genreidsList: 'required',
                    timeframesList: 'required',
                    name: 'required',
                    location: 'required',
                }
            );
            const matched = await validation.check();
            if (!matched || !location) {
                return callback(
                    {
                        code: status.INVALID_ARGUMENT,
                        message: find(validation.errors).message,
                        name: '',
                    },
                    res
                );
            }
            const createdPlace = await PlaceService.insertPlace({
                createdBy: userId,
                genreIds: genreidsList,
                timeframes: timeframesList,
                photos: photosList,
                name,
                description,
                price,
                location,
                profilePhoto: profilephoto,
            });
            res.setPlace(createdPlace);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
