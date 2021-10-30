import { Schema, Document, Model, model, Types } from 'mongoose';
import { USER_TYPE } from '../utils/Enums';
import { IVerification } from './Verification';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    name: string;
    username: string;
    type: number;
    verifications: IVerification[];
}

export interface IUserModel extends Model<IUser> {
    addVerificationId(userId: Types.ObjectId, verificationId: Types.ObjectId): Promise<any>;
}

const UserSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            unique: true,
            trim: true,
        },
        type: {
            type: Number,
            min: 0,
            max: 2,
            default: USER_TYPE.STANDARD,
        },
        verifications: {
            type: [Schema.Types.ObjectId],
        },
    },
    { timestamps: true }
);

class UserClass {
    static async addVerificationId(userId: Types.ObjectId, verificationId: Types.ObjectId) {
        const update = {
            $addToSet: { verifications: verificationId },
        };
        return UserModel.findByIdAndUpdate(userId, update);
    }
}

UserSchema.loadClass(UserClass);

export const UserModel = model<IUser>('User', UserSchema) as IUserModel;
