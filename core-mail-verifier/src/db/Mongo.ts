import mongoose, { ConnectionOptions } from 'mongoose';
import logger from '../utils/Logger';
import config from '../config';
import { NODE_ENV } from '../utils/Enums';

const options: ConnectionOptions = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    minSize: 1,
    poolSize: 1,
    useUnifiedTopology: true,
    autoReconnect: true,
    reconnectTries: 30,
    reconnectInterval: 1000,
};

if (config.nodeEnv == NODE_ENV.DEVELOPMENT) {
    mongoose.set('debug', true);
    options.poolSize = 1;
}

mongoose.connection.on('connected', () => {
    logger.info('Mongo connection successful');
});

mongoose.connection.on('error', (err) => {
    logger.error(`Mongo connection error ${err}`);
});

mongoose.connection.on('disconnected', () => {
    logger.info(`Mongo disconnected`);
});

mongoose.connection.on('disconnected', () => {
    logger.info(`Mongo disconnected`);
});

export interface GlobalConns extends NodeJS.Global {
    coreDB: typeof mongoose;
}

const init = async () => {
    const _global = global as GlobalConns;
    _global.coreDB = await mongoose.connect(config.coreDBUri, options);
};

export default init;
