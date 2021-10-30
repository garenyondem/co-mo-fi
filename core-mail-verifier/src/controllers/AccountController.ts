import { Context } from 'koa';
import { UserModel } from '../models/User';
import logger from '../utils/Logger';
import { PendingVerificationModel } from '../models/PendingVerification';
import { USER_VERIFICATION_TYPE } from '../utils/Enums';
import { VerificationModel } from '../models/Verification';
import fs from 'fs';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);

interface IAccountController {
    activate(ctx: Context, next: Function): Promise<void>;
}
class AccountController implements IAccountController {
    // Used only for email verification part of registration process
    async activate(ctx: Context, next: Function): Promise<void> {
        const activationType = USER_VERIFICATION_TYPE.EMAIL;
        var activationToken = ctx.params.token;
        if (!activationToken) {
            logger.info('Missing token data');
            ctx.unauthorized({ status: 'unauthorized' });
            return next();
        }

        const pendingVerification = await PendingVerificationModel.findByToken(activationToken, activationType);
        if (!pendingVerification) {
            logger.info('Could not find any pending verification');
            ctx.notFound({ status: 'does not exist' });
            return next();
        }

        const userId = pendingVerification.userId;
        const verification = new VerificationModel();
        verification.userId = userId;
        verification.type = activationType;
        const savedVerification = await verification.save();

        try {
            await UserModel.addVerificationId(userId, savedVerification._id);
        } catch (err) {
            logger.info('Error while adding verificationId to user ', err);
            ctx.internalServerError({ status: 'please try again' });
            return next();
        }
        await pendingVerification.remove();

        const path = `${process.cwd()}/templates/index.html`;
        ctx.type = 'html';
        ctx.body = await readFile(path, 'utf8');

        next();
    }
}

export default new AccountController();
