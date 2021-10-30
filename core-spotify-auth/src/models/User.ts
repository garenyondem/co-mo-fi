import { Schema, Document, model, Model, Types } from 'mongoose';
import { default as ExternalProfileSchema, IExternalProfileSchema } from '../schemas/ExternalProfileUrl';
import { USER_TYPE } from '../utils/Enums';
import * as PhotoSchema from 'src/schemas/Photo';
import { DEFAULT_PROFILE_PIC } from 'src/utils/Constants';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    name: string;
    username: string;
    type: string;
    externalProfileUrls: IExternalProfileSchema;
    profilePhoto?: PhotoSchema.IPhotoSchema;
}

export interface IUserModel extends Model<IUser> {}

const UserSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
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
        externalProfileUrls: {
            type: ExternalProfileSchema,
        },
        profilePhoto: {
            type: PhotoSchema.default,
            default: { original: DEFAULT_PROFILE_PIC } as PhotoSchema.IPhotoSchema,
        },
    },
    { timestamps: true }
);

export const UserModel = model<IUser>('User', UserSchema) as IUserModel;
