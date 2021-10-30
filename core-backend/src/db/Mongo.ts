import mongoose, { ConnectionOptions } from 'mongoose';
import logger from '../utils/Logger';
import config from '../config';
import { NODE_ENV, MONGOOSE_EVENT } from '../utils/Enums';

const options: ConnectionOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    minSize: 1,
    poolSize: 3,
    useUnifiedTopology: true,
    autoReconnect: true,
    reconnectTries: 30,
    reconnectInterval: 1000,
};

if (config.nodeEnv == NODE_ENV.DEVELOPMENT) {
    mongoose.set('debug', true);
    options.poolSize = 1;
}

mongoose.connection
    .on(MONGOOSE_EVENT.CONNECTED, () => {
        logger.info('Mongo connection successful');
    })
    .on(MONGOOSE_EVENT.ERROR, (err) => {
        logger.error('Mongo connection error', err);
    })
    .on(MONGOOSE_EVENT.DISCONNECTED, () => {
        logger.info('Mongo disconnected');
    })
    .on(MONGOOSE_EVENT.RECONNECTION_FAILED, () => {
        logger.info('Mongo gave up, reconnect attempts failed');
    })
    .on(MONGOOSE_EVENT.CLOSE, () => {
        mongoose.connection.removeAllListeners();
    });

export interface GlobalConns extends NodeJS.Global {
    coreDB: typeof mongoose;
}

const init = async () => {
    const _global = global as GlobalConns;
    _global.coreDB = await mongoose.connect(config.coreDBUri, options);
};

export default init;
