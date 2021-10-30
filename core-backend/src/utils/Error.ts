import { Metadata, status } from 'grpc';

import GrpcBoom from 'grpc-boom';

class CoreServiceError {
    code?: status;
    metadata?: Metadata;
    details?: string;
    constructor({ message = '', name = '', code }: { message?: string; name?: string; code?: status }) {
        const metadata: Metadata = new Metadata();
        // TODO: We will need more sophisticated error object
        return new GrpcBoom(message, {
            code,
            metadata,
        });
    }
}
export default CoreServiceError;
