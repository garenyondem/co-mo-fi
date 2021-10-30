import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import { IPlace } from './Place';
import CacheService from '../services/CacheService';
import { CACHE_KEY } from '../utils/Enums';

export interface IFollow extends Document {
    placeId: IPlace['_id'];
    userId: IUser['_id'];
    place: IPlace;
}

export interface IFollowModel extends Model<IFollow> {
    getFollowStatesOfPlaces(placeIds: Types.ObjectId[], userId: Types.ObjectId): Promise<IFollow[]>;
    getFollows(userId: Types.ObjectId, page: number): Promise<IFollow[]>;
}

const FollowSchema: Schema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

class FollowClass {
    static async getFollowStatesOfPlaces(placeIds: Types.ObjectId[], userId: Types.ObjectId): Promise<IFollow[]> {
        const query = {
            placeId: {
                $in: placeIds,
            },
            userId,
        };
        const projection = {
            placeId: 1,
        };
        return FollowModel.find(query, projection);
    }
    static async getFollows(userId: Types.ObjectId, page: number): Promise<IFollow[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const skip = page * appDefaults.FOLLOWS_LIST_DEFAULT_SIZE;

        return FollowModel.aggregate()
            .match({ userId })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(appDefaults.FOLLOWS_LIST_DEFAULT_SIZE)
            .lookup({
                from: 'places',
                let: { placeId: '$placeId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$$placeId', '$_id'],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'genres',
                            let: { genreIds: '$genreIds' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: ['$_id', '$$genreIds'],
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        name: 1,
                                    },
                                },
                            ],
                            as: 'genreIds',
                        },
                    },
                    {
                        $project: {
                            photos: 1,
                            name: 1,
                            genreIds: 1,
                        },
                    },
                ],
                as: 'place',
            })
            .project({
                place: { $arrayElemAt: ['$place', 0] },
            });
    }
}

FollowSchema.loadClass(FollowClass);

export const FollowModel = model<IFollow>('Follow', FollowSchema) as IFollowModel;
