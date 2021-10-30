import { Schema, Document, Model, model } from 'mongoose';
import { IUser } from './User';

export interface IPassword extends Document {
    hash: string;
    userId: IUser['_id'];
}

export interface IPasswordModel extends Model<IPassword> {}

const PasswordSchema: Schema = new Schema(
    {
        hash: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

class PasswordClass {}

PasswordSchema.loadClass(PasswordClass);

export const PasswordModel = model<IPassword>('Password', PasswordSchema) as IPasswordModel;
