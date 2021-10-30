import { Schema, Document, model, Model } from 'mongoose';
import { IUser } from './User';

export interface IClientToken extends Document {
    accessToken: string;
    refreshToken: string;
    userId: IUser['_id'];
}

export interface IClientTokenModel extends Model<IClientToken> {}

const ClientTokenSchema: Schema = new Schema(
    {
        accessToken: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

export const ClientTokenModel = model<IClientToken>('ClientToken', ClientTokenSchema) as IClientTokenModel;
