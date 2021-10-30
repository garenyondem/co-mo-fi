import { sendUnaryData, status, ServerReadableStream } from 'grpc';
import { ITokenData } from '../interfaces';
import { UploadImageRequest, UploadImageResponse } from '../types/UploadService_pb';
import { READABLE_STREAM_EVENT } from '../utils/Enums';
import logger from '../utils/Logger';
import UploadService from '../services/UploadService';

export interface IUploadController {
    uploadImage(
        call: ServerReadableStream<UploadImageRequest> & ITokenData,
        callback: sendUnaryData<UploadImageResponse>
    ): Promise<any>;
}

export class UploadController implements IUploadController {
    async uploadImage(
        call: ServerReadableStream<UploadImageRequest> & ITokenData,
        callback: sendUnaryData<UploadImageResponse>
    ): Promise<any> {
        logger.info('Upload image call');
        const res = new UploadImageResponse();
        const userId = call.userId;
        let imageChunks: Uint8Array[] = [];
        //TODO: must validate if one has permission to upload image to
        //      place or event or highlightedpos
        //TODO: imageChunk size control - set 3MB or less size limit

        call.on(READABLE_STREAM_EVENT.DATA, (chunk: UploadImageRequest) => {
            return imageChunks.push(chunk.getBinary_asU8());
        });
        call.on(READABLE_STREAM_EVENT.END, async () => {
            if (!call.cancelled) {
                const photo = await UploadService.uploadImage({ userId, data: imageChunks });
                res.setPhoto(photo);
            }
            callback(null, res);
            return call.destroy();
        });
        call.on(READABLE_STREAM_EVENT.ERROR, (err: Error) => {
            logger.error('UploadController uploadImage failure', err);
            callback(err, res);
            return call.destroy();
        });
    }
}
