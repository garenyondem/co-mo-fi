import SpotifyController from '../controllers/SpotifyController';
import Router from 'koa-router';

const router = new Router({ prefix: '/spotify' })
    .get('/auth', (ctx, next) => {
        SpotifyController.authenticate(ctx, next);
    })
    .get('/cb', async (ctx, next) => {
        await SpotifyController.callback(ctx, next);
    });

export default () => router.routes();
