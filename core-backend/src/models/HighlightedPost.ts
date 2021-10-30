import { Schema, Document, model, Model, Types } from 'mongoose';
import CacheService from '../services/CacheService';
import { CACHE_KEY, HIGHLIGHTED_POST_TYPE } from '../utils/Enums';
import * as PhotoSchema from '../schemas/Photo';
import { IPlace } from './Place';

export interface IHighlightedPost extends Document {
    _id: Types.ObjectId;
    placeId: IPlace['_id'];
    eventId?: Types.ObjectId; // TODO: create event model
    text: string;
    photos?: PhotoSchema.IPhotoSchema[];
    createdAt: Date;
    author: IPlace;
    type: HIGHLIGHTED_POST_TYPE;
}

export interface IHighlightedPostModel extends Model<IHighlightedPost> {
    getHighlightedPosts(page: number): Promise<IHighlightedPost[]>;
    insertHighlightedPost(
        text: string,
        type: HIGHLIGHTED_POST_TYPE,
        placeId: Types.ObjectId,
        eventId?: Types.ObjectId,
        photos?: PhotoSchema.IPhotoSchema[]
    ): Promise<IHighlightedPost>;
}

const HighlightedPostSchema = new Schema(
    {
        placeId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Place',
        },
        eventId: {
            type: Schema.Types.ObjectId,
        },
        text: {
            type: String,
        },
        photos: {
            type: [PhotoSchema.default],
        },
        saveCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        type: {
            type: Number,
            min: 0,
            max: 2,
            default: HIGHLIGHTED_POST_TYPE.MISC,
        },
    },
    { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

HighlightedPostSchema.virtual('author', {
    ref: 'Place',
    localField: 'placeId',
    foreignField: '_id',
    justOne: true,
});

class HighlightedPostClass {
    static async getHighlightedPosts(page: number): Promise<IHighlightedPost[]> {
        const appDefaults = await CacheService.getAppConfig(CACHE_KEY.APP_CONFIG);
        const skip = page * appDefaults.HIGHLIGHTS_LIST_DEFAULT_SIZE;
        return HighlightedPostModel.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(appDefaults.HIGHLIGHTS_LIST_DEFAULT_SIZE);
    }

    static async insertHighlightedPost(
        text: string,
        type: HIGHLIGHTED_POST_TYPE,
        placeId: Types.ObjectId,
        eventId?: Types.ObjectId,
        photos?: PhotoSchema.IPhotoSchema[]
    ): Promise<IHighlightedPost> {
        const highlightedPost = new HighlightedPostModel();
        highlightedPost.text = text;
        highlightedPost.type = type;
        highlightedPost.placeId = placeId;
        highlightedPost.eventId = eventId;
        highlightedPost.photos = photos;
        return highlightedPost.save();
    }
}

HighlightedPostSchema.loadClass(HighlightedPostClass);

export const HighlightedPostModel = model<IHighlightedPost>(
    'HighlightedPost',
    HighlightedPostSchema
) as IHighlightedPostModel;
