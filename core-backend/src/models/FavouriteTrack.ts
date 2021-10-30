import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { ITrack } from './Track';

export interface IFavouriteTrack extends Document {
    userId: [IUser['_id']];
    trackId: [ITrack['_id']];
}

const FavouriteTrackSchema: Schema = new Schema(
    {
        userId: {
            type: [Schema.Types.ObjectId],
            required: true,
        },
        trackId: {
            type: [Schema.Types.ObjectId],
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IFavouriteTrack>('FavouriteTrack', FavouriteTrackSchema);
