import { Schema, Document, model, Model, Types } from 'mongoose';
import CacheService from '../services/CacheService';
import { CACHE_KEY } from '../utils/Enums';
import * as PhotoSchema from '../schemas/Photo';
import { IPlace } from './Place';

export interface IFeedPost extends Document {
    _id: Types.ObjectId;
    placeId: IPlace['_id'];
    text: string;
    photos?: PhotoSchema.IPhotoSchema[];
    likeCount: number;
    createdAt: Date;
    author: IPlace;
}

export interface IFeedPostModel extends Model<IFeedPost> {
    insertFeedPost(placeId: Types.ObjectId, text: string, photos?: PhotoSchema.IPhotoSchema[]): Promise<IFeedPost>;

    getFeedList(page: number): Promise<IFeedPost[]>;
}

const FeedPostSchema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Place',
        },
        text: {
            type: String,
        },
        photos: {
            type: [PhotoSchema.default],
        },
        likeCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        saveCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

FeedPostSchema.virtual('author', {
    ref: 'Place',
    localField: 'placeId',
    foreignField: '_id',
    justOne: true,
});

class FeedPostClass {
    static async insertFeedPost(
        placeId: Types.ObjectId,
        text: string,
        photos?: PhotoSchema.IPhotoSchema[]
    ): Promise<IFeedPost> {
        const post = new FeedPostModel();
        post.placeId = placeId;
        post.text = text;
        post.photos = photos;
        return post.save();
    }

    static async getFeedList(page: number): Promise<IFeedPost[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const skip = page * appDefaults.FEED_LIST_DEFAULT_SIZE;
        return FeedPostModel.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(appDefaults.FEED_LIST_DEFAULT_SIZE)
            .populate('author', 'name profilePhoto -_id');
    }
}

FeedPostSchema.loadClass(FeedPostClass);

export const FeedPostModel = model<IFeedPost>('Post', FeedPostSchema) as IFeedPostModel;
