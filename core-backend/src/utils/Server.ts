import { status, ServiceError, Server } from 'grpc';
import { GRPC_METHOD_TYPE } from './Enums';

const getType = (method: any) => {
    var typeDict = [
        [GRPC_METHOD_TYPE.UNARY, GRPC_METHOD_TYPE.SERVER_STREAM],
        [GRPC_METHOD_TYPE.CLIENT_STREAM, GRPC_METHOD_TYPE.BIDIRECTIONAL],
        [GRPC_METHOD_TYPE.UNKNOWN],
    ];
    try {
        return typeDict[+method.requestStream][+method.responseStream];
    } catch (err) {
        return typeDict[2][0];
    }
};

const toLowerCamelCase = (str: string) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};

const lookupServiceMetadata = (service: any, implementation: any) => {
    const serviceKeys = Object.keys(service);
    const implementationKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(implementation));
    const intersectingMethods = serviceKeys
        .filter((k) => {
            return implementationKeys.map((k) => toLowerCamelCase(k)).indexOf(k) !== -1;
        })
        .reduce((acc: { [k: string]: any }, k: string) => {
            const method = service[k];
            if (!method) {
                throw new Error(`cannot find method ${k} on service`);
            }
            const components = method.path.split('/');
            acc[k] = {
                name: components[1],
                method: components[2],
                type: getType(method),
                path: method.path,
                responseType: method.responseType,
                requestType: method.requestType,
            };
            return acc;
        }, {});

    return (key: string) => {
        return Object.keys(intersectingMethods)
            .filter((k) => toLowerCamelCase(key) === k)
            .map((k) => intersectingMethods[k])
            .pop();
    };
};

const handler = {
    get(target: any, propKey: any) {
        if (propKey !== 'addService') {
            return target[propKey];
        }
        return (service: any, implementation: any) => {
            const newImplementation: { [key: string]: any } = {};
            const lookup = lookupServiceMetadata(service, implementation);
            const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(implementation));
            for (const k of keys) {
                if (k === 'contructor') continue;
                const name = k;
                const fn = implementation[k];
                const controllerFunc = (call: any, callback: any) => {
                    const ctx = {
                        call,
                        service: lookup(name),
                        status: {},
                    };
                    const newCallback = (callback: any) => {
                        return (...args: any[]) => {
                            ctx.status = {
                                code: status.OK,
                            };
                            const err = args[0];
                            if (err) {
                                ctx.status = {
                                    code: status.UNKNOWN,
                                    details: err,
                                };
                            }
                            callback(...args);
                        };
                    };
                    const interceptors = target.intercept();
                    const first = interceptors.next();
                    const errorCb = (grpcServiceError: any) => callback(grpcServiceError, null);
                    const next = () => {
                        return new Promise((resolve) => {
                            const i = interceptors.next();
                            if (i.done) {
                                return resolve(fn(call, newCallback(callback)));
                            }
                            return resolve(i.value(ctx, next, errorCb));
                        });
                    };
                    if (!first.value) {
                        // if we don't have any interceptors
                        return new Promise((resolve) => {
                            return resolve(fn(call, newCallback(callback)));
                        });
                    }
                    first.value(ctx, next, errorCb);
                };
                newImplementation[name] = controllerFunc;
            }
            return target.addService(service, newImplementation);
        };
    },
};

export class CoreGrpcServer extends Server {
    interceptors: any = [];

    constructor() {
        super();
        return new Proxy(this, handler);
    }
    use(func: (ctx: any, next: any, errorCb: any) => void) {
        this.interceptors.push(func);
    }
    *intercept() {
        let i = 0;
        while (i < this.interceptors.length) {
            yield this.interceptors[i];
            i++;
        }
    }
}
