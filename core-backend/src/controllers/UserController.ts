import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import {
    UserDetailsRequest,
    UserDetailsResponse,
    EditDetailsRequest,
    EditDetailsResponse,
    SavesRequest,
    SavesResponse,
    FollowsRequest,
    FollowsResponse,
} from '../types/UserService_pb';
import logger from '../utils/Logger';
import UserService from '../services/UserService';
import CoreServiceError from '../utils/Error';
import { ITokenData } from '../interfaces';

export interface IUserController {
    userDetails(
        call: ServerUnaryCall<UserDetailsRequest & ITokenData>,
        callback: sendUnaryData<UserDetailsResponse>
    ): Promise<any>;
    editDetails(
        call: ServerUnaryCall<EditDetailsRequest & ITokenData>,
        callback: sendUnaryData<EditDetailsResponse>
    ): Promise<any>;
    saves(call: ServerUnaryCall<SavesRequest & ITokenData>, callback: sendUnaryData<SavesResponse>): Promise<any>;
    follows(call: ServerUnaryCall<FollowsRequest & ITokenData>, callback: sendUnaryData<FollowsResponse>): Promise<any>;
}

export class UserController implements IUserController {
    async userDetails(
        call: ServerUnaryCall<UserDetailsRequest & ITokenData>,
        callback: sendUnaryData<UserDetailsResponse>
    ): Promise<any> {
        logger.info('User details');
        const res = new UserDetailsResponse();
        const { request } = call;
        const userId = request.getUserid() || request.userId;

        try {
            const user = await UserService.getUserDetails({ userId });
            res.setUser(user);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    // Can update user's 'name', 'username', 'email' and 'type' props
    async editDetails(
        call: ServerUnaryCall<EditDetailsRequest & ITokenData>,
        callback: sendUnaryData<EditDetailsResponse>
    ): Promise<any> {
        logger.info('User edit details');
        const res = new EditDetailsResponse();
        const { request } = call;
        const { userId } = request;

        try {
            const user = request.getUser();
            if (!user) {
                throw new CoreServiceError({ message: 'Missing user', code: status.INVALID_ARGUMENT });
            }
            const updatedUser = await UserService.updateUserDetails({ userId, user: user.toObject() });
            res.setUser(updatedUser);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async saves(
        call: ServerUnaryCall<SavesRequest & ITokenData>,
        callback: sendUnaryData<SavesResponse>
    ): Promise<any> {
        logger.info('User saves');
        const res = new SavesResponse();
        const { request } = call;
        const page = request.getPage();
        const userId = request.userId;

        try {
            const saves = await UserService.getUserSaves({ userId, page });
            res.setSavesList(saves);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async follows(
        call: ServerUnaryCall<FollowsRequest & ITokenData>,
        callback: sendUnaryData<FollowsResponse>
    ): Promise<any> {
        logger.info('User follows');
        const res = new FollowsResponse();
        const { request } = call;
        const page = request.getPage();
        const userId = request.userId;

        try {
            const followedPlaces = await UserService.getUserFollowedPlaces({ userId, page });
            res.setPlacesList(followedPlaces);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
