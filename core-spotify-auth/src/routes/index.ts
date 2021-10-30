import SpotifyRoutes from './SpotifyRoutes';
import Router from 'koa-router';
// @ts-ignore
import { compose } from 'koa-convert';

const router = new Router({ prefix: '/api' }).use(SpotifyRoutes());

export default () => compose([router.routes(), router.allowedMethods()]);
