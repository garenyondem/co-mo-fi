import { Schema } from 'mongoose';

export interface ITimeframeSchema {
    day: number;
    start: string;
    end: string;
}

const TimeframeSchema: Schema<ITimeframeSchema> = new Schema<ITimeframeSchema>({
    day: {
        type: Number,
        min: 1,
        max: 7,
        required: true,
    },
    start: {
        type: String,
        required: true,
    },
    end: {
        type: String,
        required: true,
    },
});

export default TimeframeSchema;
