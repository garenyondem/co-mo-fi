import { S3 } from 'aws-sdk';
import config from '../config';

class S3Adapter {
    private s3Client: S3;

    constructor(options: { accessKeyId: string; secretAccessKey: string; region: string }) {
        this.s3Client = new S3(options);
    }

    async upload(options: S3.PutObjectRequest) {
        // Experimenting with putObject/upload
        // doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
        return this.s3Client.upload(options).promise();
        //return this.s3Client.putObject(options).promise();
    }
}

export default new S3Adapter({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.s3Region,
});
