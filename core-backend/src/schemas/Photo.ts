import { Schema } from 'mongoose';

export interface IPhotoSchema {
    original: string;
    thumbnails?: string[];
}

const PhotoSchema: Schema<IPhotoSchema> = new Schema<IPhotoSchema>({
    original: {
        type: String,
        required: true,
    },
    thumbnails: {
        type: [String],
        required: true,
        default: [],
    },
});

export default PhotoSchema;
