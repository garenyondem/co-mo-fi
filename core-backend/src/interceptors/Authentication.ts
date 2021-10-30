import { status, Metadata, ServiceError } from 'grpc';
import { JwtAdapter } from '../adapters/JwtAdapter';
import config from '../config';
import { ClientTokenModel } from '../models/ClientToken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import logger from '../utils/Logger';
import { ITokenData } from '../interfaces';
import { GRPC_METHOD_TYPE } from '../utils/Enums';

export async function authenticate(ctx: any, next: any, errorCb: (err: ServiceError) => void) {
    const metadata = (ctx.call.metadata as Metadata).getMap();
    const accessToken = metadata['x-access-token'] as string;

    const authFreePaths = [
        '/Core.Backend.AccountService/Register',
        '/Core.Backend.AccountService/Login',
        '/Core.Backend.AccountService/Recover',
        '/Core.Backend.AccountService/RefreshToken',
        '/Core.Backend.SpotifyService/Authorize',
    ];
    const isCallAuthFree = authFreePaths.some((path) => path == ctx.service.path);

    function rejectionHandler(message: string, code: status, errorCb: (err: ServiceError) => void) {
        return errorCb({
            code,
            message,
            name: '',
        });
    }

    function mergeRequestAndTokenData(request: any, tokenData: ITokenData) {
        return Object.assign(request, tokenData);
    }

    if (isCallAuthFree) {
        return next();
    } else if (!accessToken) {
        logger.info('Access token is not supplied');
        return rejectionHandler('Access token is not supplied', status.UNAUTHENTICATED, errorCb);
    }

    try {
        const tokenData = (await new JwtAdapter(config.jwtSecrets.mobile.accessToken).verifyAccessToken(
            accessToken
        )) as ITokenData;
        tokenData.accessToken = accessToken;
        const tokenCount = await ClientTokenModel.countDocuments({
            userId: tokenData.userId,
            accessToken: tokenData.accessToken,
        }).limit(1);
        if (!tokenCount) {
            // token count is 0
            throw new JsonWebTokenError('Could not match token with any record');
        }
        if (ctx.service.type === GRPC_METHOD_TYPE.UNARY) {
            ctx.call.request = mergeRequestAndTokenData(ctx.call.request, tokenData);
        } else {
            ctx.call = mergeRequestAndTokenData(ctx.call, tokenData);
        }
        return next();
    } catch (err) {
        switch (true) {
            case err instanceof TokenExpiredError:
                logger.info('Expired access token ', err);
                return rejectionHandler('Expired access token', status.UNAUTHENTICATED, errorCb);
            case err instanceof JsonWebTokenError:
                logger.error('Invalid access token ', err);
                return rejectionHandler('Invalid access token', status.UNAUTHENTICATED, errorCb);
            default:
                logger.error('System error ', err);
                return rejectionHandler('System error', status.INTERNAL, errorCb);
        }
    }
}
