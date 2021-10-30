import { Schema } from 'mongoose';
import { LOCATION_TYPE } from '../utils/Enums';

export interface IPointSchema {
    type: string;
    coordinates: number[];
}

const PointSchema: Schema<IPointSchema> = new Schema<IPointSchema>(
    {
        type: {
            type: String,
            default: LOCATION_TYPE.POINT,
            required: true,
        },
        coordinates: {
            type: [Number], // [lon, lat] // Istanbul lon = 28.979530, lat = 41.015137
            required: true,
        },
    },
    { _id: false }
);

export default PointSchema;
