import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { Empty } from '../types/Empty_pb';
import {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RecoverRequest,
    RecoverResponse,
} from '../types/AccountService_pb';
import logger from '../utils/Logger';
import { Validator } from 'node-input-validator';
import AccountService from '../services/AccountService';
import CoreServiceError from '../utils/Error';
import { find } from 'lodash';
import { ITokenData } from '../interfaces';

export interface IAccountController {
    register(call: ServerUnaryCall<RegisterRequest>, callback: sendUnaryData<RegisterResponse>): Promise<any>;
    login(call: ServerUnaryCall<LoginRequest>, callback: sendUnaryData<LoginResponse>): Promise<any>;
    logout(call: ServerUnaryCall<Empty>, callback: sendUnaryData<Empty>): Promise<any>;
    refreshToken(
        call: ServerUnaryCall<RefreshTokenRequest>,
        callback: sendUnaryData<RefreshTokenResponse>
    ): Promise<any>;
    recover(call: ServerUnaryCall<RecoverRequest>, callback: sendUnaryData<RecoverResponse>): Promise<any>;
}

export class AccountController implements IAccountController {
    async register(call: ServerUnaryCall<RegisterRequest>, callback: sendUnaryData<RegisterResponse>): Promise<any> {
        logger.info('User Register');
        const res = new RegisterResponse();
        const { request } = call;
        const name = request.getName();
        const username = request.getUsername();
        const email = request.getEmail();
        const password = request.getPassword();

        // TODO: move input validation to separate file as interceptor
        const validation = new Validator(
            { name, username, email, password },
            {
                name: 'required',
                username: 'required',
                email: 'required|email',
                password: 'required|minLength:6',
            }
        );
        const matched = await validation.check();
        if (!matched) {
            return callback(
                {
                    code: status.INVALID_ARGUMENT,
                    message: find(validation.errors).message,
                    name: '',
                },
                res
            );
        }

        try {
            await AccountService.register({ name, email, username, password });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async login(call: ServerUnaryCall<LoginRequest>, callback: sendUnaryData<LoginResponse>): Promise<any> {
        logger.info('User Login');
        const res = new LoginResponse();
        const { request } = call;
        const email = request.getEmail();
        const password = request.getPassword();

        try {
            const savedClientToken = await AccountService.login({ email, password });

            res.setAccesstoken(savedClientToken.accessToken);
            res.setRefreshtoken(savedClientToken.refreshToken);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async logout(call: ServerUnaryCall<Empty & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('User Logout');
        const res = new Empty();
        const { userId } = call.request;

        try {
            await AccountService.logout({ userId });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async refreshToken(
        call: ServerUnaryCall<RefreshTokenRequest>,
        callback: sendUnaryData<RefreshTokenResponse>
    ): Promise<any> {
        logger.info('User Refresh Token');
        const res = new RefreshTokenResponse();
        const { request } = call;
        const refreshToken = request.getRefreshtoken();

        try {
            if (!refreshToken?.length) {
                // refreshtoken exists but it is empty
                throw new CoreServiceError({ message: 'Missing refresh token value', code: status.INVALID_ARGUMENT });
            }
            const newAccessToken = await AccountService.refreshToken({ refreshToken });
            res.setAccesstoken(newAccessToken);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async recover(call: ServerUnaryCall<RecoverRequest>, callback: sendUnaryData<RecoverResponse>): Promise<any> {
        logger.info('User Recover Account');
        const { request } = call;
        const email = request.getEmail();
        const res = new RecoverResponse();

        try {
            await AccountService.recover({ email });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
