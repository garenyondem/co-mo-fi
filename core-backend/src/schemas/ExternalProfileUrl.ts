import { Schema } from 'mongoose';

export interface IExternalProfileSchema {
    spotify: string;
}

const ExternalProfileSchema: Schema<IExternalProfileSchema> = new Schema<IExternalProfileSchema>(
    {
        spotify: {
            type: String,
        },
    },
    { _id: false }
);

export default ExternalProfileSchema;
