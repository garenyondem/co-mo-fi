import fetch, { RequestInit, Response } from 'node-fetch';
import { isString } from 'util';

interface RequestOptions extends RequestInit {}

function checkStatus(res: Response) {
    if (res.ok) {
        // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw Error(res.statusText);
    }
}
class FetchAdapter {
    async get<T>(url: string, headers?: { [key: string]: string }) {
        const options: RequestOptions = {
            method: 'GET',
            headers: headers,
        };
        const res = await fetch(url, options)
            .then(checkStatus)
            .then((res) => res.json());
        return res as T;
    }

    async post<T>(url: string, body: object | string, headers?: { [key: string]: string }) {
        const defaultHeaders = { 'Content-Type': 'application/json' };
        const finalHeaders = { ...defaultHeaders, ...headers };
        const options: RequestOptions = {
            method: 'POST',
            body: isString(body) ? body : JSON.stringify(body),
            headers: finalHeaders,
        };
        const res = await fetch(url, options)
            .then(checkStatus)
            .then((res) => res.json());
        return res as T;
    }
}

export default new FetchAdapter();
