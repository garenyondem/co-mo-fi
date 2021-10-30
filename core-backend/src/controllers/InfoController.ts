import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { ClientInfoRequest, ClientInfoResponse } from '../types/InfoService_pb';
import logger from '../utils/Logger';
import { GenreModel } from '../models/Genre';
import { Genre } from '../types/Genre_pb';
import InfoService from '../services/InfoService';
import CoreServiceError from '../utils/Error';
import AccountService from '../services/AccountService';
import { getDistanceUnitByLocale } from '../utils/Helpers';
import UserService from '../services/UserService';
import { convertToProtoLinkedAccount } from '../converters';
import RoleService from '../services/RoleService';
import { ITokenData } from '../interfaces';

export interface IInfoController {
    clientInfo(
        call: ServerUnaryCall<ClientInfoRequest & ITokenData>,
        callback: sendUnaryData<ClientInfoResponse>
    ): Promise<any>;
}
// TODO: this controller needs to be cleaned up from business logic
export class InfoController implements IInfoController {
    async clientInfo(
        call: ServerUnaryCall<ClientInfoRequest & ITokenData>,
        callback: sendUnaryData<ClientInfoResponse>
    ): Promise<any> {
        logger.info('Client info');
        const res = new ClientInfoResponse();
        const { request } = call;
        const { userId, accessToken } = request;
        const appInfo = request.getApp();
        const deviceInfo = request.getDevice();

        try {
            if (!appInfo || !deviceInfo) {
                throw new CoreServiceError({ message: 'Missing device or app info', code: status.INVALID_ARGUMENT });
            }
            const upsertedClientDevice = await InfoService.upsertClientInfo({
                userId,
                appInfo: appInfo.toObject(),
                deviceInfo: deviceInfo.toObject(),
            });
            await AccountService.associateAccessTokenWithDevice({
                userId,
                accessToken,
                clientDeviceId: upsertedClientDevice._id,
            });

            res.setDistanceunit(getDistanceUnitByLocale(deviceInfo.getLocale()));

            // TODO: move this to genre services
            const genreRecommendations = await GenreModel.findSampleGenres(7);
            for (let x of genreRecommendations) {
                const genre = new Genre();
                genre.setName(x.name);
                res.addGenrerecommendations(genre);
            }

            const [linkedAccountsMeta, userAccountMeta] = await Promise.all([
                UserService.getLinkedAccountsMeta({ userId }),
                UserService.getUserAccountMeta({ userId }),
            ]);
            if (userAccountMeta) {
                linkedAccountsMeta.push(userAccountMeta);
            }

            res.setLinkedaccountsList(linkedAccountsMeta.map(convertToProtoLinkedAccount));

            const roleDetails = await RoleService.getUserRoleDetails({ userId });
            res.setRoledetails(roleDetails);

            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
