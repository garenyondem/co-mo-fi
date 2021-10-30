import AccountController from '../controllers/AccountController';
import Router from 'koa-router';

const router = new Router({ prefix: '/account' }).get('/activate/:token', async (ctx, next) => {
    await AccountController.activate(ctx, next);
});

export default () => router.routes();
