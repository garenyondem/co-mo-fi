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
    upsertMailVerification(userId: Types.ObjectId, token: string): Promise<any>;
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

PendingVerificationSchema.index({ createdAt: 1 }, { expires: '7d' });

class PendingVerificationClass {
    static async upsertMailVerification(userId: Types.ObjectId, token: string) {
        const query = {
            userId,
            type: USER_VERIFICATION_TYPE.EMAIL,
        };
        return PendingVerificationModel.findOneAndUpdate(query, { token }, { upsert: true, new: true });
    }
}

PendingVerificationSchema.loadClass(PendingVerificationClass);

export const PendingVerificationModel = model<IPendingVerification>(
    'PendingVerification',
    PendingVerificationSchema
) as IPendingVerificationModel;
