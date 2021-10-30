import { Schema, Document, Model, model } from 'mongoose';
import { IUser } from './User';
import { IPlace } from './Place';

export interface ILinkedAccount extends Document {
    userId: IUser['_id'];
    placeId: IPlace['_id'];
}

export interface ILinkedAccountModel extends Model<ILinkedAccount> {}

const LinkedAccountSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        placeId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        createdAt: {
            type: Schema.Types.Date,
            default: new Date(),
            required: true,
        },
    },
    { versionKey: false }
);

class LinkedAccountClass {}

LinkedAccountSchema.loadClass(LinkedAccountClass);

export const LinkedAccountModel = model<ILinkedAccount>('LinkedAccount', LinkedAccountSchema) as ILinkedAccountModel;
