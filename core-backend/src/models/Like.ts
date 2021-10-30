import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import { IFeedPost } from './FeedPost';
import { ISongRecommendation } from './SongRecommendation';
import { IEvent } from './Event';

export interface ILike extends Document {
    postId: IFeedPost['_id'];
    songRecommendationId: ISongRecommendation['_id'];
    userId: IUser['_id'];
    eventId: IEvent['_id'];
}

export interface ILikeModel extends Model<ILike> {
    getLikeStatesOfPosts(postIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ILike[]>;
    getLikeStatesOfSongRecommendations(
        songRecommendationIds: Types.ObjectId[],
        userId: Types.ObjectId
    ): Promise<ILike[]>;
}

const LikeSchema: Schema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
        },
        songRecommendationId: {
            type: Schema.Types.ObjectId,
        },
        eventId: {
            type: Schema.Types.ObjectId
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

class LikeClass {
    static async getLikeStatesOfPosts(postIds: Types.ObjectId[], userId: Types.ObjectId): Promise<ILike[]> {
        const query = {
            postId: {
                $in: postIds,
            },
            userId,
        };
        const projection = {
            postId: 1,
        };
        return LikeModel.find(query, projection);
    }

    static async getLikeStatesOfSongRecommendations(
        songRecommendationIds: Types.ObjectId[],
        userId: Types.ObjectId
    ): Promise<ILike[]> {
        const query = {
            songRecommendationId: { $in: songRecommendationIds },
            userId,
        };
        const projection = {
            songRecommendationId: 1,
        };
        return LikeModel.find(query, projection);
    }
}

LikeSchema.loadClass(LikeClass);

export const LikeModel = model<ILike>('Like', LikeSchema) as ILikeModel;
