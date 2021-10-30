import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import { USER_VERIFICATION_TYPE } from '../utils/Enums';

export interface IVerification extends Document {
    _id: Types.ObjectId;
    userId: IUser['_id'];
    type: USER_VERIFICATION_TYPE;
}

export interface IVerificationModel extends Model<IVerification> {}

const VerificationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        type: {
            // USER_VERIFICATION_TYPE
            type: Number,
            min: 0,
            max: 2,
        },
    },
    { versionKey: false, timestamps: true }
);

class VerificationClass {}

VerificationSchema.loadClass(VerificationClass);

export const VerificationModel = model<IVerification>('Verification', VerificationSchema) as IVerificationModel;
