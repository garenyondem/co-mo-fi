import { PasswordModel, IPassword } from '../models/Password';
import { Types } from 'mongoose';

class PasswordService {
    async savePassword(options: { hashedPassword: string; userId: Types.ObjectId }): Promise<IPassword> {
        const password = new PasswordModel();
        password.hash = options.hashedPassword;
        password.userId = options.userId;
        return password.save();
    }
}

export default new PasswordService();
