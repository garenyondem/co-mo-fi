import { Schema, Document, model, Model, Types } from 'mongoose';
import { unionBy } from 'lodash';

export interface IGenre extends Document {
    _id: Types.ObjectId;
    name: string;
}

export interface IGenreModel extends Model<IGenre> {
    search(name: string, select: string[]): Promise<IGenre[]>;
    searchFull(name: string, select: string[]): Promise<IGenre[]>;
    searchPartial(name: string, select: string[]): Promise<IGenre[]>;
    findSampleGenres(size: number): Promise<IGenre[]>;
}

const GenreSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    { versionKey: false }
);

GenreSchema.index({ name: 'text' });

class GenreClass {
    static async search(name: string, select: string[] = []): Promise<IGenre[]> {
        const [fullResult, partialResult] = await Promise.all([
            this.searchFull(name, select),
            this.searchPartial(name, select),
        ]);
        return unionBy<IGenre>(fullResult, partialResult, '_id');
    }

    static async searchFull(name: string, select: string[]): Promise<IGenre[]> {
        return GenreModel.find({ $text: { $search: name, $language: 'en' } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .select(select);
    }

    static async searchPartial(name: string, select: string[]): Promise<IGenre[]> {
        return GenreModel.find({ name: new RegExp(name, 'gi') }).select(select);
    }
    static async findSampleGenres(size: number): Promise<IGenre[]> {
        // TODO: consider caching genres in mem to increase performance
        // This will be called on every app launch.
        return GenreModel.aggregate()
            .sample(size)
            .project({ _id: 0 });
    }
}

GenreSchema.loadClass(GenreClass);

export const GenreModel = model<IGenre>('Genre', GenreSchema) as IGenreModel;
