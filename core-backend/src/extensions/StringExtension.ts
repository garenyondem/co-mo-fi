import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';

declare global {
    interface String {
        /**
         * Convert valid string to ObjectId
         */
        toObjectId(this: string): Types.ObjectId;
    }
}
String.prototype.toObjectId = function(this: string): ObjectId {
    if (!Types.ObjectId.isValid(this)) {
        throw new Error('Invalid ObjectId value');
    }
    return Types.ObjectId(this);
};
