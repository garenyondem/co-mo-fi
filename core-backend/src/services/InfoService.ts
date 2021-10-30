import { App } from '../types/App_pb';
import { Device } from '../types/Device_pb';
import { ClientDeviceModel } from '../models/ClientDevice';

class InfoService {
    async upsertClientInfo(options: { userId: string; appInfo: App.AsObject; deviceInfo: Device.AsObject }) {
        const userId = options.userId.toObjectId();
        const { androididentifier, iosidentifier } = options.deviceInfo;

        let query = {} as { [key: string]: any };
        let update = {} as { [key: string]: any };
        if (androididentifier) {
            const advertisingId = androididentifier.advertisingid;
            query = { userId, advertisingId };
            update.firebaseToken = androididentifier.firebasetoken;
            update.apiLevel = androididentifier.apilevel;
        } else if (iosidentifier) {
            const uuid = iosidentifier.uuid;
            query = { userId, uuid };
            update.udid = iosidentifier.udid;
            update.osVersion = iosidentifier.osversion;
        }
        update.appVersion = options.appInfo.version;
        update.buildNumber = options.appInfo.buildnumber;
        update.os = options.deviceInfo.os;
        update.manufacturer = options.deviceInfo.manufacturer;
        update.deviceModel = options.deviceInfo.model;
        update.locale = options.deviceInfo.locale;

        return ClientDeviceModel.findOneAndUpdate(query, update, {
            upsert: true,
            new: true,
        });
    }
}

export default new InfoService();
