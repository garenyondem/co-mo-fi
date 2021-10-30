import AccountRoutes from './AccountRoutes';
import Router from 'koa-router';
// @ts-ignore
import { compose } from 'koa-convert';

const router = new Router({ prefix: '/api' }).use(AccountRoutes());

export default () => compose([router.routes(), router.allowedMethods()]);
