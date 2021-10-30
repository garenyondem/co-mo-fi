import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import PointSchema, { IPointSchema } from '../schemas/Point';

export interface IClientLocationHistory extends Document {
    userId: IUser['_id'];
    location: IPointSchema;
}

export interface IClientLocationHistoryModel extends Model<IClientLocationHistory> {
    getLastKnownLocation(userId: Types.ObjectId): Promise<IClientLocationHistory | null>;
}

const ClientLocationHistorySchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        location: {
            type: PointSchema,
            required: true,
            default: PointSchema,
        },
        createdAt: {
            type: Schema.Types.Date,
            default: new Date(),
            required: true,
        },
    },
    { versionKey: false }
);

// Keep location data for 24hrs
ClientLocationHistorySchema.index({ createdAt: 1 }, { expires: '1d' });

class ClientLocationHistoryClass {
    static async getLastKnownLocation(userId: Types.ObjectId): Promise<IClientLocationHistory | null> {
        return ClientLocationHistoryModel.findOne({ userId }, { location: 1 })
            .sort({ _id: -1 })
            .lean();
    }
}

ClientLocationHistorySchema.loadClass(ClientLocationHistoryClass);

export const ClientLocationHistoryModel = model<IClientLocationHistory>(
    'ClientLocationHistory',
    ClientLocationHistorySchema
) as IClientLocationHistoryModel;
