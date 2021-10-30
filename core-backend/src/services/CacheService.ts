import CacheAdapter from '../adapters/CacheAdapter';
import { AppConfigModel, IAppConfig } from '../models/AppConfig';

class CacheService {
    private ttlSeconds = 300; // 5 min
    private cache = new CacheAdapter(this.ttlSeconds);

    private async loadAppConfig(): Promise<IAppConfig> {
        return AppConfigModel.get();
    }

    private cacheAppConfig(cacheKey: string | number, appConfig: IAppConfig): void {
        this.cache.set(cacheKey, appConfig);
    }

    async getAppConfig(cacheKey: string | number): Promise<IAppConfig> {
        const cachedAppConfig = this.cache.get(cacheKey) as any;
        if (cachedAppConfig) {
            return Promise.resolve<IAppConfig>(cachedAppConfig);
        }
        const appConfig = await this.loadAppConfig();
        this.cacheAppConfig(cacheKey, appConfig);
        return appConfig;
    }
}

export default new CacheService();
