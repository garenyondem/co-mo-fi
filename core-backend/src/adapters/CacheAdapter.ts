import NodeCache from 'node-cache';
class CacheAdapter {
    private cacheClient: NodeCache;
    constructor(ttlSeconds: number) {
        this.cacheClient = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false,
            deleteOnExpire: true,
        });
    }
    get(key: string | number) {
        return this.cacheClient.get(key);
    }
    set(key: string | number, value: any) {
        this.cacheClient.set(key, value);
    }
    del(keys: string | number | (string | number)[]) {
        this.cacheClient.del(keys);
    }
    flush() {
        this.cacheClient.flushAll();
    }
}
export default CacheAdapter;
