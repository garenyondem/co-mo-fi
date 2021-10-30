import { Schema, Document, model, Model, Types } from 'mongoose';
import { IUser } from './User';
import { USER_VERIFICATION_TYPE } from '../utils/Enums';

export interface IPendingVerification extends Document {
    _id: Types.ObjectId;
    userId: IUser['_id'];
    token: string;
    type: USER_VERIFICATION_TYPE;
}

export interface IPendingVerificationModel extends Model<IPendingVerification> {
    findByToken(token: string, type?: USER_VERIFICATION_TYPE): Promise<IPendingVerification | null>;
}

const PendingVerificationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        token: {
            type: String,
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

class PendingVerificationClass {
    static async findByToken(token: string, type?: USER_VERIFICATION_TYPE) {
        const query = {
            token,
            type,
        };
        return PendingVerificationModel.findOne(query);
    }
}

PendingVerificationSchema.loadClass(PendingVerificationClass);

export const PendingVerificationModel = model<IPendingVerification>(
    'PendingVerification',
    PendingVerificationSchema
) as IPendingVerificationModel;
