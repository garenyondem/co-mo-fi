import { Point } from '../types/Point_pb';
import { PlaceModel } from '../models/Place';
import { FollowModel } from '../models/Follow';
import { GenreModel, IGenre } from '../models/Genre';
import { SongRecommendation } from '../types/PlacesService_pb';
import {
    convertToProtoPlace,
    convertToProtoSongRecommendation,
    convertToMongoPhoto,
    convertToMongoLocation,
    convertToMongoTimeframe,
} from '../converters';
import { SongRecommendationModel } from '../models/SongRecommendation';
import { LikeModel } from '../models/Like';
import { Timeframe } from '../types/Timeframe_pb';
import { Photo } from '../types/Photo_pb';
import { omitBy, isEmpty } from 'lodash';
import CoreServiceError from '../utils/Error';
import { status } from 'grpc';
import logger from '../utils/Logger';
import UserService from './UserService';
import SpotifyService from './SpotifyService';
import { ClientLocationHistoryModel } from '../models/ClientLocationHistory';

class PlaceService {
    async getPlaceRecommendations(options: { userId: string; point: Point.AsObject }) {
        const userCoords = [options.point.lat, options.point.lon];
        const distanceOption = { unit: 'km' };
        const places = await PlaceModel.findSamplePlaces(23, options.point.lat, options.point.lon);
        const placeIds = places.map((place) => place._id);
        const followStates = await FollowModel.getFollowStatesOfPlaces(placeIds, options.userId.toObjectId());

        return places.map((mongoPlace) => {
            const following = followStates.some((follow) => {
                return follow.placeId.toHexString() === mongoPlace._id.toHexString();
            });
            return convertToProtoPlace(mongoPlace, following, userCoords, distanceOption);
        });
    }

    async searchPlaces(options: { userId: string; text: string; point: Point.AsObject }) {
        const userCoords = [options.point.lat, options.point.lon];
        const distanceOption = { unit: 'km' };

        const artistAndSongGenres = await SpotifyService.searchGenresForPlaceFilter({
            userId: options.userId,
            text: options.text,
        });

        const uniqueGenres = [...new Set([...artistAndSongGenres, options.text.trim()])];
        const searchTerm = uniqueGenres.join(' ');
        const genreIds = await GenreModel.search(searchTerm, ['_id']);

        const places = await PlaceModel.filter(options.point.lat, options.point.lon, options.text, genreIds);
        const placeIds = places.map((place) => place._id);
        const followStates = await FollowModel.getFollowStatesOfPlaces(placeIds, options.userId.toObjectId());

        return places.map((mongoPlace) => {
            const following = followStates.some((follow) => {
                return follow.placeId.toHexString() === mongoPlace._id.toHexString();
            });
            return convertToProtoPlace(mongoPlace, following, userCoords, distanceOption);
        });
    }

    async getSongRecommendationsOfPlace(options: {
        placeId: string;
        page: number;
        userId: string;
    }): Promise<SongRecommendation[]> {
        const placeId = options.placeId.toObjectId();
        const userId = options.userId.toObjectId();
        const songRecommendations = await SongRecommendationModel.getPlaceSongRecommendations(placeId, options.page);
        const songRecommendationIds = songRecommendations.map((x) => x._id);
        const likeStates = await LikeModel.getLikeStatesOfSongRecommendations(songRecommendationIds, userId);

        return songRecommendations.map((mongoSongRecommendation) => {
            const liked = likeStates.some((like) => {
                return like.songRecommendationId.toHexString() === mongoSongRecommendation._id.toHexString();
            });
            return convertToProtoSongRecommendation(mongoSongRecommendation, { liked, saved: false });
        });
    }

    async getPlace(options: { userId: string; placeId: string }) {
        const userId = options.userId.toObjectId();
        const placeId = options.placeId.toObjectId();
        const distanceOption = { unit: 'km' };

        const [mongoPlace, followStates] = await Promise.all([
            PlaceModel.getDetailsById(placeId),
            FollowModel.getFollowStatesOfPlaces([placeId], userId),
        ]);
        const userLocation = await ClientLocationHistoryModel.getLastKnownLocation(userId);
        const userCoords = userLocation?.location.coordinates.reverse();
        const following = followStates.some((follow) => {
            return follow.placeId.toHexString() === placeId.toHexString();
        });
        return convertToProtoPlace(mongoPlace, following, userCoords, distanceOption);
    }

    async updatePlaceDetails(options: {
        userId: string;
        placeId: string;
        genreIds?: string[];
        timeframes?: Timeframe.AsObject[];
        photos?: Photo.AsObject[];
        name?: string;
        description?: string;
        price?: number;
        location?: Point.AsObject;
        profilePhoto?: Photo.AsObject;
    }) {
        //TODO: Get the update diff and check if user has enough permission to update a field
        const updateCandidates = {
            genreIds: options.genreIds?.map((x) => x.toObjectId()),
            timeframes: options.timeframes?.map(convertToMongoTimeframe),
            photos: options.photos?.map(convertToMongoPhoto),
            name: options.name,
            description: options.description,
            price: options.price,
            location: options.location ? convertToMongoLocation(options.location) : undefined,
            profilePhoto: options.profilePhoto ? convertToMongoPhoto(options.profilePhoto) : undefined,
        };
        const update = omitBy(updateCandidates, isEmpty);
        await PlaceModel.findByIdAndUpdate(options.placeId, update);
        const updatedPlace = await PlaceModel.getDetailsById(options.placeId.toObjectId());
        return convertToProtoPlace(updatedPlace, false);
    }

    async insertPlace(options: {
        createdBy: string;
        genreIds: string[];
        timeframes: Timeframe.AsObject[];
        photos: Photo.AsObject[];
        name: string;
        description: string;
        price: number;
        location: Point.AsObject;
        profilePhoto?: Photo.AsObject;
    }) {
        //TODO: Get the update diff and check if user has enough permission to update a field
        const newPlace = new PlaceModel();
        newPlace.createdBy = options.createdBy.toObjectId();
        newPlace.genreIds = options.genreIds.map((idStr) => {
            return {
                _id: idStr.toObjectId(),
            } as IGenre;
        });
        newPlace.timeframes = options.timeframes.map(convertToMongoTimeframe);
        newPlace.photos = options.photos.map(convertToMongoPhoto);
        newPlace.name = options.name;
        newPlace.description = options.description;
        newPlace.price = options.price;
        newPlace.location = convertToMongoLocation(options.location);
        if (options.profilePhoto) {
            newPlace.profilePhoto = convertToMongoPhoto(options.profilePhoto);
        }

        try {
            const { _id } = await newPlace.save();
            const [createdPlace] = await Promise.all([
                PlaceModel.getDetailsById(_id),
                UserService.insertToLinkedAccount({
                    userId: options.createdBy,
                    placeId: _id.toHexString(),
                }),
            ]);
            return convertToProtoPlace(createdPlace, false);
        } catch (err) {
            logger.error('Error while creating place ', err);
            throw new CoreServiceError({ message: 'Error while creating place', code: status.INTERNAL });
        }
    }
}

export default new PlaceService();
