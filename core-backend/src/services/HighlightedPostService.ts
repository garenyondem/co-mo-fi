import { HighlightedPostModel } from '../models/HighlightedPost';
import { Types } from 'mongoose';
import { SaveModel } from '../models/Save';

class HighlightedPostService {
    async increaseSaveCount(options: { contentId: Types.ObjectId }) {
        return HighlightedPostModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: 1 } });
    }

    async decreaseSaveCount(options: { contentId: Types.ObjectId }) {
        return HighlightedPostModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: -1 } });
    }

    async save(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const saveModel = new SaveModel({
            userId: options.userId,
            highlightedPostId: options.contentId,
        });
        return saveModel.save();
    }

    async unsave(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            highlightedPostId: options.contentId,
        };
        return SaveModel.findOneAndRemove(query);
    }
}

export default new HighlightedPostService();
