import { Schema, Document, model, Model, Types } from 'mongoose';
import { IGenre } from './Genre';
import CacheService from '../services/CacheService';
import { CACHE_KEY, LOCATION_TYPE } from './../utils/Enums';
import * as TimeframeSchema from '../schemas/Timeframe';
import * as PhotoSchema from '../schemas/Photo';
import * as PointSchema from '../schemas/Point';
import { DEFAULT_PLACE_PROFILE_PIC } from '../utils/Constants';

export interface IPlace extends Document {
    _id: Types.ObjectId;
    location: PointSchema.IPointSchema;
    genreIds: IGenre[];
    price: number;
    name: string;
    rating: number;
    contact?: string;
    description?: string;
    photos?: PhotoSchema.IPhotoSchema[];
    timeframes: TimeframeSchema.ITimeframeSchema[];
    profilePhoto?: PhotoSchema.IPhotoSchema;
    createdBy?: Types.ObjectId;
}

export interface IPlaceModel extends Model<IPlace> {
    findSamplePlaces(size: number, lat: number, lon: number, distanceMeters?: number): Promise<IPlace[]>;
    filter(lat: number, lon: number, text?: string, genres?: IGenre[]): Promise<IPlace[]>;
    getDetailsById(placeId: Types.ObjectId): Promise<IPlace>;
}

const PlaceSchema = new Schema(
    {
        location: {
            type: PointSchema.default,
            required: true,
        },
        genreIds: {
            type: [Schema.Types.ObjectId],
            required: true,
            ref: 'Genre',
        },
        price: {
            type: Number,
            min: 1,
            max: 3,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            default: 10,
            min: 0,
            max: 10,
        },
        contact: {
            type: String,
        },
        description: {
            type: String,
        },
        photos: {
            type: [PhotoSchema.default],
        },
        timeframes: {
            type: [TimeframeSchema.default],
            required: true,
        },
        profilePhoto: {
            type: PhotoSchema.default,
            default: { original: DEFAULT_PLACE_PROFILE_PIC } as PhotoSchema.IPhotoSchema,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
        },
    },
    { timestamps: true }
);

PlaceSchema.index({ location: '2dsphere' });

class PlaceClass {
    static async findSamplePlaces(size: number, lat: number, lon: number, distanceMeters: number): Promise<IPlace[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        return PlaceModel.aggregate()
            .near({
                near: { type: LOCATION_TYPE.POINT, coordinates: [lon, lat] },
                distanceField: 'location.distance',
                maxDistance: distanceMeters || appDefaults.SAMPLE_PLACES_DEFAULT_DISTANCE, // meters
                spherical: true,
            })
            .limit(appDefaults.SAMPLE_PLACES_DEFAULT_SIZE)
            .sample(size)
            .lookup({ from: 'genres', localField: 'genreIds', foreignField: '_id', as: 'genreIds' })
            .project({ 'genreIds._id': 0 });
    }

    static async filter(
        lat: number,
        lon: number,
        name?: string, // TODO: text can be track, album or artist
        genres?: IGenre[]
    ): Promise<IPlace[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const aggregator = PlaceModel.aggregate();
        aggregator.near({
            near: { type: LOCATION_TYPE.POINT, coordinates: [lon, lat] },
            distanceField: 'location.distance',
            maxDistance: appDefaults.FILTER_PLACES_DEFAULT_DISTANCE,
            spherical: true,
        });
        aggregator.limit(appDefaults.FILTER_PLACES_DEFAULT_SIZE);
        let matchQuery = { $or: [] as object[] };
        if (name) {
            matchQuery.$or.push({
                name: new RegExp(name, 'gi'),
            });
        }
        if (genres) {
            const genreIds: Types.ObjectId[] = genres.map((x) => x._id);
            matchQuery.$or.push({
                genreIds: { $in: genreIds },
            });
        }
        if (matchQuery.$or.length) {
            aggregator.match(matchQuery);
        }
        aggregator.lookup({ from: 'genres', localField: 'genreIds', foreignField: '_id', as: 'genreIds' });
        aggregator.project({ 'genreIds._id': 0 });
        aggregator.sort({ distance: 1 });
        return aggregator;
    }

    static async getDetailsById(placeId: Types.ObjectId): Promise<IPlace> {
        const res = await PlaceModel.aggregate()
            .match({ _id: placeId })
            .lookup({ from: 'genres', localField: 'genreIds', foreignField: '_id', as: 'genreIds' })
            .project({ 'genreIds._id': 0 });
        return res.shift();
    }
}

PlaceSchema.loadClass(PlaceClass);

export const PlaceModel = model<IPlace>('Place', PlaceSchema) as IPlaceModel;
