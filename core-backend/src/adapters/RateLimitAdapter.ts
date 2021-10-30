import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

class RateLimitAdapter {
    private rateLimiter: RateLimiterMemory;
    // In the future this can be used to set different rate limiters with different options.
    private keyPrefix = 'co-';
    private duration = 1; // Second
    private blockDuration = 600; // 10 x 60 secs

    /**
     * Total available credits for timw windows (duration), points will reset after.
     * @param requestPerSecond - Maximum number of requests can be done over a second.
     * @param blockDuration - Number of seconds before consumed credits are reset. - default: 600 seconds
     */
    constructor(requestPerSecond: number, blockDuration?: number) {
        this.rateLimiter = new RateLimiterMemory({
            points: requestPerSecond,
            duration: this.duration,
            keyPrefix: this.keyPrefix,
            blockDuration: blockDuration || this.blockDuration,
        });
    }
    /**
     * @param key - IP of client or other unique identifier
     * @param credits - Credit to spend for action - default: 1
     */
    async consume(key: string, credits: number = 1) {
        try {
            return await this.rateLimiter.consume(key, credits);
        } catch (err) {
            const secondsBeforeNext = Math.ceil((err as RateLimiterRes).msBeforeNext / 1000);
            throw {
                secondsBeforeNext,
            };
        }
    }
}

export default RateLimitAdapter;
