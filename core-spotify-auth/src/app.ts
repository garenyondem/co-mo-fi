import config from './config';
import Koa from 'koa';
import convert from 'koa-convert';
import cors from '@koa/cors';
import logger from 'koa-logger';
import { default as initMongoConnections } from './db/Mongo';
// @ts-ignore
import lusca from 'koa-lusca';
// @ts-ignore
import maxrequests from 'koa-maxrequests';
// @ts-ignore
import respond from 'koa-respond';

initMongoConnections();

class App {
    public app: Koa;

    constructor() {
        this.app = new Koa();
        this.mountMiddlewares();
    }
    private mountMiddlewares(): void {
        if (config.nodeEnv == 'development') {
            this.app.use(logger());
        }

        this.app.use(convert(maxrequests({ max: 200 })));
        this.app.use(convert(cors()));

        const luscaOptions = {
            xframe: 'SAMEORIGIN',
            hsts: { maxAge: 31536000, includeSubDomains: true },
            xssProtection: true,
        };
        this.app.use(convert(lusca(luscaOptions)));

        const respondOptions = {
            statusMethods: {
                unprocessableEntity: 422,
            },
        };
        this.app.use(convert(respond(respondOptions)));
    }
}

export default new App().app;
