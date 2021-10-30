import S3Adapter from '../adapters/S3Adapter';
import nanoid from 'nanoid';
import { convertToProtoPhoto } from '../converters';
import { IPhotoSchema } from '../schemas/Photo';

class UploadService {
    async uploadImage(options: { userId: string; data: Uint8Array[] }) {
        const userId = options.userId.toObjectId();
        const fileId = nanoid();
        // TODO: Save userId-fileId pair to db

        const { Location } = await S3Adapter.upload({
            Bucket: 'core-images',
            Key: `original/${fileId}.jpg`,
            Body: Buffer.concat(options.data),
        });
        return convertToProtoPhoto({ original: Location } as IPhotoSchema);
    }
}

export default new UploadService();
