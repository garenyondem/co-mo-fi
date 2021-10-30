import { Schema, Document, Model, model, Types } from 'mongoose';
import { USER_TYPE } from '../utils/Enums';
import { IGenre } from './Genre';
import PointSchema from '../schemas/Point';
import ExternalProfileSchema, { IExternalProfileSchema } from '../schemas/ExternalProfileUrl';
import { IVerification } from './Verification';
import * as PhotoSchema from '../schemas/Photo';
import { DEFAULT_PROFILE_PIC } from '../utils/Constants';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    name: string;
    username: string;
    favouriteGenres: IGenre[];
    type: number;
    externalProfileUrls: IExternalProfileSchema;
    verifications: IVerification[];
    profilePhoto?: PhotoSchema.IPhotoSchema;
}

export interface IUserModel extends Model<IUser> {
    getDetailsById(userId: Types.ObjectId): Promise<IUser>;
    getVerificationsByEmail(email: string): Promise<IUser>;
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
        favouriteGenres: [Schema.Types.ObjectId],
        type: {
            type: Number,
            min: 0,
            max: 2,
            default: USER_TYPE.STANDARD,
        },
        location: {
            type: PointSchema,
        },
        externalProfileUrls: {
            type: ExternalProfileSchema,
        },
        verifications: {
            type: [Schema.Types.ObjectId],
        },
        profilePhoto: {
            type: PhotoSchema.default,
            default: { original: DEFAULT_PROFILE_PIC } as PhotoSchema.IPhotoSchema,
        },
    },
    { timestamps: true }
);

UserSchema.path('email').validate(async (value: string) => {
    const count = await UserModel.countDocuments({ email: value }).limit(1);
    return !count;
}, 'Email already exists');

UserSchema.path('username').validate(async (value: string) => {
    const count = await UserModel.countDocuments({ username: value }).limit(1);
    return !count;
}, 'Username already exists');

class UserClass {
    static async getDetailsById(userId: Types.ObjectId): Promise<IUser> {
        const res = await UserModel.aggregate()
            .match({ _id: userId })
            .lookup({ from: 'genres', localField: 'favouriteGenres', foreignField: '_id', as: 'favouriteGenres' })
            .project({ 'favouriteGenres._id': 0 });
        return res.shift();
    }
    static async getVerificationsByEmail(email: string): Promise<IUser> {
        const res = await UserModel.aggregate()
            .match({ email })
            .lookup({ from: 'verifications', localField: 'verifications', foreignField: '_id', as: 'verifications' });
        return res.shift();
    }
}

UserSchema.loadClass(UserClass);

export const UserModel = model<IUser>('User', UserSchema) as IUserModel;
