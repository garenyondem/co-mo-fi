import { Schema, Document, model, Model } from 'mongoose';
import { IUser } from './User';

export interface ISpotifyToken extends Document {
    accessToken: string;
    refreshToken: string;
    userId: IUser['_id'];
    expiresAt: Date;
    spotifyUserId: string;
    tokenType: string;
}

export interface ISpotifyTokenModel extends Model<ISpotifyToken> { }

const SpotifyTokenSchema: Schema = new Schema(
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
        expiresAt: {
            type: Date,
            required: true,
        },
        spotifyUserId: {
            type: String,
            required: true,
            unique: true,
        },
        tokenType: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

export const SpotifyTokenModel = model<ISpotifyToken>('SpotifyToken', SpotifyTokenSchema) as ISpotifyTokenModel;
