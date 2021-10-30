import { UserRoleModel } from '../models/UserRole';
import { convertToProtoRole } from '../converters';

class RoleService {
    async getUserRoleDetails(options: { userId: string }) {
        const userId = options.userId.toObjectId();
        const roleDetails = await UserRoleModel.getDetails(userId);
        if (roleDetails) {
            return convertToProtoRole(roleDetails);
        } else {
            return; // Probably standard user.
        }
    }
}

export default new RoleService();
