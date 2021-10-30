import { Context } from 'koa';
import SpotifyService, { ISpotifyUserProfile, ISpotifyUserToken } from '../services/SpotifyService';
import { UserModel } from '../models/User';
import { SpotifyTokenModel } from '../models/SpotifyToken';
import logger from '../utils/Logger';
import { JwtAdapter } from '../adapters/JwtAdapter';
import { ClientTokenModel } from '../models/ClientToken';
import nanoid = require('nanoid');
import config from '../config';

interface ISpotifyController {
    authenticate(ctx: Context, next: Function): void;
    callback(ctx: Context, next: Function): Promise<void>;
}
class SpotifyController implements ISpotifyController {
    authenticate(ctx: Context, next: Function): void {
        logger.info('Spotify authentication in progress');
        ctx.redirect(SpotifyService.getAurhorizationUri());
        next();
    }

    async callback(ctx: Context, next: Function): Promise<void> {
        var queryParams = ctx.query;
        logger.info('Spotify callback received');
        if (queryParams.code) {
            var authorizationCode = queryParams.code; // An authorization code that can be exchanged for an spotify access token
            const tokenData = await SpotifyService.getToken(authorizationCode);
            const profileData = await SpotifyService.getUserProfile(tokenData.tokenType, tokenData.accessToken);
            // TODO: Too much logic in controller
            async function upsertUserProfile(profileData: ISpotifyUserProfile) {
                const existingUser = await UserModel.findOne({ email: profileData.email });
                if (existingUser) {
                    return existingUser;
                } else {
                    const user = new UserModel();
                    user.name = profileData.displayName;
                    user.email = profileData.email || '';
                    user.externalProfileUrls = profileData.externalUrls;
                    user.username = `${profileData.email.split('@')[0]}-${nanoid(8)}`;
                    return user.save();
                }
            }
            function createUserSpotifyToken(tokenData: ISpotifyUserToken, userId: any) {
                const spotifyToken = new SpotifyTokenModel();
                spotifyToken.accessToken = tokenData.accessToken;
                spotifyToken.refreshToken = tokenData.refreshToken;
                spotifyToken.tokenType = tokenData.tokenType;
                const date = new Date();
                date.setSeconds(date.getSeconds() + tokenData.expiresIn);
                spotifyToken.expiresAt = date;
                spotifyToken.userId = userId;
                spotifyToken.spotifyUserId = profileData.id;
                return spotifyToken.save();
            }
            function createClientToken(token: { accessToken: string; refreshToken: string }, userId: any) {
                const clientToken = new ClientTokenModel();
                clientToken.userId = userId;
                clientToken.accessToken = token.accessToken;
                clientToken.refreshToken = token.refreshToken;
                return clientToken.save();
            }
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

            let userId: string;
            const existingSpotifyToken = await SpotifyTokenModel.findOne({ spotifyUserId: profileData.id });
            if (existingSpotifyToken) {
                // update existing token
                const date = new Date();
                date.setSeconds(date.getSeconds() + tokenData.expiresIn);
                existingSpotifyToken.accessToken = tokenData.accessToken;
                existingSpotifyToken.refreshToken = tokenData.refreshToken;
                existingSpotifyToken.tokenType = tokenData.tokenType;
                existingSpotifyToken.expiresAt = date;
                await existingSpotifyToken.save();
                userId = existingSpotifyToken.userId.toHexString();
            } else {
                // create new profile and token
                const savedUser = await upsertUserProfile(profileData);
                const savedUserSpotifyToken = await createUserSpotifyToken(tokenData, savedUser._id);
                userId = savedUser._id.toHexString();
            }
            const payload = { userId };
            const token = await generateTokens(payload);
            const savedClientToken = await createClientToken(token, userId);
            ctx.ok({
                status: 'ok',
                accessToken: savedClientToken.accessToken,
                refreshToken: savedClientToken.refreshToken,
            });
        } else if (queryParams.error && queryParams.error == 'access_denied') {
            ctx.unauthorized({ status: 'cancelled' });
        } else if (queryParams.error) {
            ctx.unauthorized({ status: 'unauthorized' });
        } else {
            logger.error('Unidentified error from Spotify callback', queryParams);
            ctx.internalServerError({ status: 'error' });
        }
        next();
    }
}

export default new SpotifyController();
