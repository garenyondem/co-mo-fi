import mongoose, { Schema, Document } from 'mongoose';
import { IGenre } from './Genre';

export interface ITrack extends Document {
    name: string;
    artist: string;
    genre: IGenre['_id'];
    album: string;
    coverUrl: string;
    durationMs: number;
    spotifyId: string;
}

const TrackSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        //TODO: decide if this should be artists arr for tracks with multiple performers
        artist: {
            type: String,
            required: true,
        },
        genre: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        album: {
            type: String,
            required: true,
        },
        coverUrl: {
            type: String,
        },
        durationMs: {
            type: Number,
        },
        spotifyId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<ITrack>('Track', TrackSchema);
