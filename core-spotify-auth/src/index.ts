import http from 'http';
import app from './app';
import routes from './routes';
import logger from './utils/Logger';
import config from './config';
import { GlobalConns } from './db/Mongo';

const server = http.createServer(app.callback());

app.use(routes());

app.listen(config.servicePort, () => {
    logger.info(`App listening on ${config.servicePort}`);
});

process.on('SIGTERM', disconnect).on('SIGINT', disconnect);

function disconnect() {
    (global as GlobalConns).coreDB.connection.close(() => {
        process.exit(0);
    });
}
