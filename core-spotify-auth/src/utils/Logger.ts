import { createLogger, LoggerOptions, transports, format } from 'winston';
import config from '../config';

const _format = format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});
const options: LoggerOptions = {
    transports: [
        new transports.Console({
            handleExceptions: true,
            format: format.combine(format.timestamp(), format.simple(), _format),
        }),
        new transports.File({ filename: 'debug.log', level: 'debug', handleExceptions: true }),
        new transports.File({ filename: 'error.log', level: 'error', handleExceptions: true }),
    ],
    exitOnError: false,
};

const logger = createLogger(options);

if (config.nodeEnv !== 'production') {
    logger.debug('Logging initialized at debug level');
}

export default logger;
