import { Schema, Document, model, Model } from 'mongoose';
import { IUser } from './User';

export interface IClientDevice extends Document {
    userId: IUser['_id'];
    appVersion: string;
    os: number;
    manufacturer: string;
    deviceModel: string;
    locale: string;
    advertisingId: string;
    firebaseToken: string;
    uuid: string;
    udid: string;
}

export interface IClientDeviceModel extends Model<IClientDevice> {}

const ClientDeviceSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        appVersion: {
            type: String,
        },
        os: {
            type: Number,
            min: 0,
            max: 1,
            required: true,
        },
        manufacturer: {
            type: String,
        },
        deviceModel: {
            type: String,
        },
        locale: {
            type: String,
        },
        advertisingId: {
            type: String,
        },
        firebaseToken: {
            type: String,
        },
        uuid: {
            type: String,
        },
        udid: {
            type: String,
        },
        buildNumber: {
            type: String,
        },
        osVersion: {
            type: String,
        },
        apiLevel: {
            type: String,
        },
    },
    { timestamps: true }
);

class ClientDeviceClass {}

ClientDeviceSchema.loadClass(ClientDeviceClass);

export const ClientDeviceModel = model<IClientDevice>('ClientDevice', ClientDeviceSchema) as IClientDeviceModel;
