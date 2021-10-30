import { Schema, Model, Types, model, Document } from 'mongoose';
import * as PointSchema from '../schemas/Point';
import * as PhotoSchema from '../schemas/Photo';
import { IPlace } from './Place';

export interface IEvent extends Document {
    _id: Types.ObjectId;
    title: string;
    location: PointSchema.IPointSchema;
    startDate: Date;
    endDate: Date;
    quota: number;
    placeId: IPlace['_id'];
    photos?: PhotoSchema.IPhotoSchema[];
}

export interface IEventModel extends Model<IEvent> {}

const EventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        location: {
            type: PointSchema.default,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        quota: {
            type: Number,
        },
        attendeeCount: {
            type: Number,
            default: 0,
        },
        placeId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Place',
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
    { timestamps: true }
);

class EventClass {}

EventSchema.loadClass(EventClass);

export const EventModel = model<IEvent>('Event', EventSchema) as IEventModel;
