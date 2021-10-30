import logger from '../utils/Logger';
import MailService from './MailService';
import { UserModel, IUser } from '../models/User';
import { PendingVerificationModel } from '../models/PendingVerification';
import BcryptAdapter from '../adapters/BcryptAdapter';
import { PasswordModel, IPassword } from '../models/Password';
import { status } from 'grpc';
import CoreServiceError from '../utils/Error';
import { USER_VERIFICATION_TYPE } from '../utils/Enums';
import config from '../config';
import { JwtAdapter } from '../adapters/JwtAdapter';
import { ClientTokenModel } from '../models/ClientToken';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { Types, Error } from 'mongoose';
import PasswordService from './PasswordService';
import { IVerification } from '../models/Verification';

class AccountService {
    async register(options: { name: string; email: string; username: string; password: string }) {
        const user = new UserModel();
        user.name = options.name;
        user.email = options.email;
        user.username = options.username;
        let savedUser: IUser;

        try {
            savedUser = await user.save();
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                let errMessage = '';
                if (err.errors?.username) {
                    errMessage = 'Username is already taken';
                } else if (err.errors?.email) {
                    errMessage = 'Email is already taken';
                }
                logger.info(errMessage);
                throw new CoreServiceError({ message: errMessage, code: status.ALREADY_EXISTS });
            } else {
                logger.error('Error while registering user ', err);
                throw new CoreServiceError({ message: 'Error while registering user', code: status.INTERNAL });
            }
        }

        const [sentMail, hashedPassword] = await Promise.all([
            MailService.sendVerificationMail(savedUser.name, savedUser.email),
            BcryptAdapter.hash(options.password),
        ]);

        if (sentMail.successful) {
            await PendingVerificationModel.upsertMailVerification(savedUser._id, sentMail.verificationToken);
        } else {
            logger.info('Could not insert mail verification');
            //TODO: retry verification mail
        }
        await PasswordService.savePassword({ hashedPassword, userId: savedUser._id });
    }

    async login(options: { email: string; password: string }) {
        async function verifyUserVerificationExists() {
            const user = await UserModel.getVerificationsByEmail(options.email);
            if (!user) {
                logger.info('Supplied email does not exist');
                throw new CoreServiceError({ message: 'No such email or password', code: status.INVALID_ARGUMENT });
            }
            return user;
        }
        async function verifyPasswordExists(userId: Types.ObjectId) {
            const passwordDoc = (await PasswordModel.findOne({ userId }, { hash: 1 }).lean()) as IPassword;
            if (!passwordDoc) {
                logger.error('Could not find the password of this user');
                throw new CoreServiceError({ message: 'No such email or password', code: status.INVALID_ARGUMENT });
            }
            return passwordDoc;
        }
        async function verifyPasswordMatch(password: string, hash: string) {
            const match = await BcryptAdapter.verify(password, hash);
            if (!match) {
                logger.info('Password does not match');
                throw new CoreServiceError({ message: 'No such email or password', code: status.INVALID_ARGUMENT });
            }
        }
        async function verifyEmailVerification(verifications: IVerification[]) {
            const emailVerified = verifications.some((x) => x.type === USER_VERIFICATION_TYPE.EMAIL);
            if (!emailVerified) {
                logger.info('Email is not verified');
                throw new CoreServiceError({ message: 'Email is not verified', code: status.INVALID_ARGUMENT });
            }
        }

        const user = await verifyUserVerificationExists();
        const passwordDoc = await verifyPasswordExists(user._id);
        await verifyPasswordMatch(options.password, passwordDoc.hash);
        await verifyEmailVerification(user.verifications);

        async function generateTokens(payload: object) {
            // TODO: move these into a constants file
            const accessTokenExpiration = '30d'; // 30 days in seconds
            const refreshTokenExpiration = '90d'; // 90 days in seconds
            const [accessToken, refreshToken] = await Promise.all([
                new JwtAdapter(config.jwtSecrets.mobile.accessToken).generateAccessToken(
                    payload,
                    accessTokenExpiration
                ),
                new JwtAdapter(config.jwtSecrets.mobile.refreshToken).generateRefreshToken(
                    undefined,
                    refreshTokenExpiration
                ),
            ]);
            return {
                accessToken,
                refreshToken,
            };
        }

        function createClientToken(token: { accessToken: string; refreshToken: string }, userId: any) {
            const clientToken = new ClientTokenModel();
            clientToken.userId = userId;
            clientToken.accessToken = token.accessToken;
            clientToken.refreshToken = token.refreshToken;
            return clientToken.save();
        }

        const payload = { userId: user._id };
        const token = await generateTokens(payload);
        const clientToken = await createClientToken(token, user._id);
        return clientToken;
    }

    async logout(options: { userId: string }) {
        return ClientTokenModel.remove({ userId: options.userId });
    }

    async refreshToken(options: { refreshToken: string }) {
        // TODO: move these jwt generations functions into a helper
        async function generateAccessToken(payload: object) {
            // TODO: move these into a constants file
            const accessTokenExpiration = '30d'; // 30 days in seconds
            const accessToken = await new JwtAdapter(config.jwtSecrets.mobile.accessToken).generateAccessToken(
                payload,
                accessTokenExpiration
            );
            return accessToken;
        }

        try {
            await new JwtAdapter(config.jwtSecrets.mobile.refreshToken).verifyRefreshToken(options.refreshToken);
            const clientToken = await ClientTokenModel.findOne({ refreshToken: options.refreshToken }, { userId: 1 });
            if (!clientToken) {
                logger.info('Could not match refresh token with any record');
                throw new CoreServiceError({ message: 'Invalid refresh token', code: status.INVALID_ARGUMENT });
            }
            const newAccessToken = await generateAccessToken({ userId: clientToken.userId });
            await ClientTokenModel.findOneAndUpdate(
                { userId: clientToken.userId, refreshToken: options.refreshToken },
                { accessToken: newAccessToken }
            );
            return newAccessToken;
        } catch (err) {
            switch (true) {
                case err instanceof TokenExpiredError:
                    logger.info('Expired refresh token ', err);
                    throw new CoreServiceError({ message: 'Invalid refresh token', code: status.INVALID_ARGUMENT });
                case err instanceof JsonWebTokenError:
                    logger.error('Invalid refresh token ', err);
                    throw new CoreServiceError({ message: 'Invalid refresh token', code: status.INVALID_ARGUMENT });
                default:
                    logger.error('Internal server error at refresh token controller ', err);
                    throw new CoreServiceError({ code: status.INTERNAL });
            }
        }
    }

    async recover(options: { email: string }) {
        // TODO: Send special (unique & temporary) callback link through mail service
        throw new CoreServiceError({ message: 'Method not implemented', code: status.UNIMPLEMENTED });
    }

    async associateAccessTokenWithDevice(options: {
        userId: string;
        accessToken: string;
        clientDeviceId: Types.ObjectId;
    }) {
        const query = {
            userId: options.userId,
            accessToken: options.accessToken,
        };
        const update = {
            clientDeviceId: options.clientDeviceId,
        };
        const opitons = {
            upsert: true,
            new: true,
        };
        return ClientTokenModel.findOneAndUpdate(query, update, opitons);
    }
}

export default new AccountService();
