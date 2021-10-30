import { Schema } from 'mongoose';

export interface ISongSchema {
    name: string;
    cover: string;
    artist: string;
    spotifySongId: string;
    externalUrl: string;
}

const SongSchema: Schema<ISongSchema> = new Schema<ISongSchema>({
    name: {
        type: String,
        required: true,
    },
    cover: {
        type: String,
    },
    artist: {
        type: String,
    },
    spotifySongId: {
        type: String,
    },
    externalUrl: {
        type: String,
    },
}, { _id: false });

export default SongSchema;
