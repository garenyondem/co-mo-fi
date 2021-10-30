import { Schema, Document, Model, model, Types } from 'mongoose';
import { IUser } from './User';
import { IRole, RoleModel } from './Role';

export interface IUserRole extends Document {
    userId: IUser['_id'];
    roleId: IRole['_id'];
}

export interface IUserRoleModel extends Model<IUserRole> {
    getDetails(userId: Types.ObjectId): Promise<IRole | null>;
}

const UserRoleSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        roleId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

class UserRoleClass {
    static async getDetails(userId: Types.ObjectId): Promise<IRole | null> {
        const userRoleMap = (await UserRoleModel.findOne({ userId })
            .select({ roleId: 1, _id: 0 })
            .lean()) as IUserRole;
        if (!userRoleMap) {
            return null;
        }
        return RoleModel.findById(userRoleMap.roleId)
            .select({ _id: 0 })
            .lean();
    }
}

UserRoleSchema.loadClass(UserRoleClass);

export const UserRoleModel = model<IUserRole>('UserRole', UserRoleSchema) as IUserRoleModel;
