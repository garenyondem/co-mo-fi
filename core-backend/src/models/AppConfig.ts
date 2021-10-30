import { Schema, Document, model, Model, Types } from 'mongoose';
import logger from '../utils/Logger';

export interface IAppConfig extends Document {
    _id: Types.ObjectId;
    SAMPLE_PLACES_DEFAULT_DISTANCE: number;
    SAMPLE_PLACES_DEFAULT_SIZE: number;
    FILTER_PLACES_DEFAULT_DISTANCE: number;
    FILTER_PLACES_DEFAULT_SIZE: number;
    FEED_LIST_DEFAULT_SIZE: number;
    HIGHLIGHTS_LIST_DEFAULT_SIZE: number;
    FOLLOWS_LIST_DEFAULT_SIZE: number;
    SAVES_LIST_DEFAULT_SIZE: number;
    SONG_RECOMMENDATIONS_LIST_DEFAULT_SIZE: number;
}

export interface IAppConfigModel extends Model<IAppConfig> {
    get(): Promise<IAppConfig>;
}

const AppConfigSchema: Schema = new Schema(
    {
        SAMPLE_PLACES_DEFAULT_DISTANCE: Number, // Meters
        SAMPLE_PLACES_DEFAULT_SIZE: Number,
        FILTER_PLACES_DEFAULT_DISTANCE: Number, // Meters
        FILTER_PLACES_DEFAULT_SIZE: Number,
        FEED_LIST_DEFAULT_SIZE: Number,
        HIGHLIGHTS_LIST_DEFAULT_SIZE: Number,
        FOLLOWS_LIST_DEFAULT_SIZE: Number,
        SAVES_LIST_DEFAULT_SIZE: Number,
        SONG_RECOMMENDATIONS_LIST_DEFAULT_SIZE: Number,
    },
    { versionKey: false }
);

class AppConfigClass {
    static async get(): Promise<IAppConfig> {
        const res = await AppConfigModel.findOne();
        if (res) {
            return res;
        } else {
            logger.info('Could not get AppConfig from coreDB');
            return {
                SAMPLE_PLACES_DEFAULT_DISTANCE: 999,
                SAMPLE_PLACES_DEFAULT_SIZE: 2,
                FILTER_PLACES_DEFAULT_DISTANCE: 999,
                FILTER_PLACES_DEFAULT_SIZE: 12,
                FEED_LIST_DEFAULT_SIZE: 12,
                HIGHLIGHTS_LIST_DEFAULT_SIZE: 4,
                FOLLOWS_LIST_DEFAULT_SIZE: 12,
                SAVES_LIST_DEFAULT_SIZE: 12,
                SONG_RECOMMENDATIONS_LIST_DEFAULT_SIZE: 6,
            } as IAppConfig;
        }
    }
}

AppConfigSchema.loadClass(AppConfigClass);

export const AppConfigModel = model<IAppConfig>('AppConfig', AppConfigSchema) as IAppConfigModel;
