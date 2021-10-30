import fetch, { RequestInit, Response } from 'node-fetch';
import logger from '../utils/Logger';
import { isString } from 'lodash';

interface RequestOptions extends RequestInit { }

function checkStatus(res: Response) {
    if (res.ok) {
        // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw new Error(res.statusText);
    }
}
class FetchAdapter {
    async get<T>(url: string, headers?: { [key: string]: string }): Promise<T | undefined> {
        try {
            const options: RequestOptions = {
                method: 'GET',
                headers: headers,
            };
            return await fetch(url, options).then(checkStatus).then((res) => res.json());
        } catch (err) {
            logger.error(`FetchAdapter get ${url} `, err);
            throw err;
        }
    }

    async post<T>(url: string, body: object | string, headers?: { [key: string]: string }): Promise<T | undefined> {
        const defaultHeaders = { 'Content-Type': 'application/json' };
        const finalHeaders = { ...defaultHeaders, ...headers };
        const options: RequestOptions = {
            method: 'POST',
            body: isString(body) ? body : JSON.stringify(body),
            headers: finalHeaders,
        };
        try {
            return await fetch(url, options).then(checkStatus).then((res) => res.json());
        } catch (err) {
            logger.error(`FetchAdapter post ${url} `, err);
            throw err;
        }
    }
}

export default new FetchAdapter();