import { Schema, Document, Model, model, Types } from 'mongoose';
import { ROLE_TYPE } from '../utils/Enums';
export interface IRole extends Document {
    _id: Types.ObjectId;
    name: string;
    type: number;
    attributes: {
        place: {
            editName: boolean;
            editGenres: boolean;
            editLocation: boolean;
            editTimeframes: boolean;
            editEmployees: boolean;
        };
        feed: {
            sendFeedPost: boolean;
        };
    };
}

export interface IRoleModel extends Model<IRole> {}

const RoleSchema: Schema = new Schema(
    {
        name: { type: String },
        type: {
            type: Number,
            min: 0,
            max: 3,
            default: ROLE_TYPE.STANDARD,
        },
        attributes: {
            place: {
                editName: Boolean,
                editGenres: Boolean,
                editLocation: Boolean,
                editTimeframes: Boolean,
                editEmployees: Boolean,
            },
            feed: {
                sendFeedPost: Boolean,
            },
        },
    },
    { timestamps: true, versionKey: false }
);

class RoleClass {}

RoleSchema.loadClass(RoleClass);

export const RoleModel = model<IRole>('Role', RoleSchema) as IRoleModel;
