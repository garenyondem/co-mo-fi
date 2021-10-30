import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import { IFeedPost } from './FeedPost';
import { IHighlightedPost } from './HighlightedPost';
import { IEvent } from './Event';
import CacheService from '../services/CacheService';
import { CACHE_KEY } from '../utils/Enums';

export interface ISave extends Document {
    userId: IUser['_id'];
    postId: IFeedPost['_id'];
    feedPost: IFeedPost;
    highlightedPostId: IHighlightedPost['_id'];
    highlightedPost: IHighlightedPost;
    eventId: IEvent['_id'];
    event: IEvent;
}

export interface ISaveModel extends Model<ISave> {
    getSaveStatesOfPosts(postIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ISave[]>;
    getSaveStatesOfHighlightedPosts(highlightedPostIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ISave[]>;
    getSaveStatesOfEvents(eventIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ISave[]>;
    getSaves(userId: Types.ObjectId, page: number): Promise<ISave[]>;
}

const SaveSchema: Schema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
        },
        highlightedPostId: {
            type: Schema.Types.ObjectId,
        },
        eventId: {
            type: Schema.Types.ObjectId,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

class SaveClass {
    static async getSaveStatesOfPosts(postIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ISave[]> {
        const query = {
            postId: {
                $in: postIds,
            },
            userId,
        };
        const projection = {
            postId: 1,
        };
        return SaveModel.find(query, projection);
    }

    static async getSaveStatesOfHighlightedPosts(
        highlightedPostIds: Types.ObjectId[],
        userId: Types.ObjectId
    ): Promise<ISave[]> {
        const query = {
            highlightedPostId: {
                $in: highlightedPostIds,
            },
            userId,
        };
        const projection = {
            highlightedPostId: 1,
        };
        return SaveModel.find(query, projection);
    }

    static async getSaveStatesOfEvents(eventIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ISave[]> {
        const query = {
            eventId: {
                $in: eventIds,
            },
            userId,
        };
        const projection = {
            eventId: 1,
        };
        return SaveModel.find(query, projection);
    }

    static async getSaves(userId: Types.ObjectId, page: number): Promise<ISave[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const skip = page * appDefaults.SAVES_LIST_DEFAULT_SIZE;

        return (
            SaveModel.aggregate()
                .match({ userId })
                .skip(skip)
                .limit(appDefaults.SAVES_LIST_DEFAULT_SIZE)
                .sort({ _id: -1 })
                // join posts
                .lookup({ from: 'posts', localField: 'postId', foreignField: '_id', as: 'feedPost' })
                // join highlighted posts
                .lookup({
                    from: 'highlightedposts',
                    localField: 'highlightedPostId',
                    foreignField: '_id',
                    as: 'highlightedPost',
                })
                // convert array fields to single objects
                .project({
                    feedPost: { $arrayElemAt: ['$feedPost', 0] },
                    highlightedPost: { $arrayElemAt: ['$highlightedPost', 0] },
                })
                // join posts author data from places
                .lookup({
                    from: 'places',
                    let: { placeId: '$feedPost.placeId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$$placeId', '$_id'],
                                },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                photos: 1,
                                _id: 0,
                            },
                        },
                    ],
                    as: 'feedPost.author',
                })
        );
    }
}

SaveSchema.loadClass(SaveClass);

export const SaveModel = model<ISave>('Save', SaveSchema) as ISaveModel;
