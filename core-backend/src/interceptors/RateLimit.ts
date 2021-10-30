import { status, ServiceError } from 'grpc';
import logger from '../utils/Logger';
import RateLimitAdapter from '../adapters/RateLimitAdapter';
import { mapClientConnectionData } from '../utils/Helpers';

const requestsPerSecond = 20;
const blockDurationSeconds = 600; // 10 min
const RateLimit = new RateLimitAdapter(requestsPerSecond, blockDurationSeconds);

export async function rateLimit(ctx: any, next: any, errorCb: (err: ServiceError) => void) {
    const rateLimitFreePaths = ['/Core.Backend.UploadService/UploadImage'];
    const isRateLimitFreePath = rateLimitFreePaths.some((path) => path == ctx.service.path);

    function rejectionHandler(message: string, code: status, errorCb: (err: ServiceError) => void) {
        return errorCb({
            code,
            message,
            name: '',
        });
    }

    const peer = ctx.call.getPeer();
    const { ip } = mapClientConnectionData(peer);
    try {
        if (!isRateLimitFreePath) {
            await RateLimit.consume(ip);
        }
    } catch (err) {
        logger.info(`Too many requests from ${peer}`);
        return rejectionHandler(
            `Slow down, try again in ${err.secondsBeforeNext} seconds.`,
            status.RESOURCE_EXHAUSTED,
            errorCb
        );
    }
    return next();
}
