import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import SongSchema, { ISongSchema } from '../schemas/Song';
import { IPlace } from './Place';
import CacheService from '../services/CacheService';
import { CACHE_KEY } from '../utils/Enums';

export interface ISongRecommendation extends Document {
    _id: Types.ObjectId;
    placeId: IPlace['_id'];
    song: ISongSchema;
    recommendedBy: IUser['_id'];
    recommendationCount: number;
}

export interface ISongRecommendationModel extends Model<ISongRecommendation> {
    getPlaceSongRecommendations(placeId: Types.ObjectId, page: number): Promise<ISongRecommendation[]>;
}

const SongRecommendationSchema: Schema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        song: {
            type: SongSchema,
            required: true,
        },
        recommendedBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        recommendationCount: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    { timestamps: true, versionKey: false }
);

class SongRecommendationClass {
    static async getPlaceSongRecommendations(placeId: Types.ObjectId, page: number): Promise<ISongRecommendation[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const skip = page * appDefaults.SONG_RECOMMENDATIONS_LIST_DEFAULT_SIZE;
        return SongRecommendationModel.find({ placeId })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(appDefaults.FEED_LIST_DEFAULT_SIZE)
            .populate('recommendedBy', 'name -_id');
    }
}

SongRecommendationSchema.loadClass(SongRecommendationClass);

export const SongRecommendationModel = model<ISongRecommendation>(
    'SongRecommendation',
    SongRecommendationSchema
) as ISongRecommendationModel;
