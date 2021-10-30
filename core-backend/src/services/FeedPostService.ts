import { FeedPostModel } from '../models/FeedPost';
import { Types } from 'mongoose';
import { LikeModel } from '../models/Like';
import { SaveModel } from '../models/Save';

class FeedPostService {
    async increaseLikeCount(options: { contentId: Types.ObjectId }) {
        return FeedPostModel.findByIdAndUpdate(options.contentId, { $inc: { likeCount: 1 } });
    }

    async decreaseLikeCount(options: { contentId: Types.ObjectId }) {
        return FeedPostModel.findByIdAndUpdate(options.contentId, { $inc: { likeCount: -1 } });
    }

    async increaseSaveCount(options: { contentId: Types.ObjectId }) {
        return FeedPostModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: 1 } });
    }

    async decreaseSaveCount(options: { contentId: Types.ObjectId }) {
        return FeedPostModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: -1 } });
    }

    async like(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const like = new LikeModel({
            userId: options.userId,
            postId: options.contentId,
        });
        return like.save();
    }

    async unlike(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            postId: options.contentId,
        };
        return LikeModel.findOneAndRemove(query);
    }

    async save(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const saveModel = new SaveModel({
            userId: options.userId,
            postId: options.contentId,
        });
        return saveModel.save();
    }

    async unsave(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            postId: options.contentId,
        };
        return SaveModel.findOneAndRemove(query);
    }
}

export default new FeedPostService();
