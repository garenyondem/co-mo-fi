import { Types } from 'mongoose';
import { ISongSchema } from '../schemas/Song';
import { SongRecommendationModel } from '../models/SongRecommendation';
import { LikeModel } from '../models/Like';
import { SaveModel } from '../models/Save';

class SongRecommendationService {
    async increaseLikeCount(options: { contentId: Types.ObjectId }) {
        return SongRecommendationModel.findByIdAndUpdate(options.contentId, {
            $inc: { recommendationCount: 1 },
        });
    }

    async decreaseLikeCount(options: { contentId: Types.ObjectId }) {
        return SongRecommendationModel.findByIdAndUpdate(options.contentId, {
            $inc: { recommendationCount: -1 },
        });
    }

    async increaseSaveCount(options: { contentId: Types.ObjectId }) {
        throw new Error('Not implemented');
    }

    async decreaseSaveCount(options: { contentId: Types.ObjectId }) {
        throw new Error('Not implemented');
    }

    async insertSongRecommendation(options: { userId: string; placeId: string; songDetails: ISongSchema }) {
        const songRecommendation = new SongRecommendationModel();
        songRecommendation.song = options.songDetails;
        songRecommendation.placeId = options.placeId.toObjectId();
        songRecommendation.recommendedBy = options.userId.toObjectId();
        return songRecommendation.save();
    }

    async like(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const like = new LikeModel({
            userId: options.userId,
            songRecommendationId: options.contentId,
        });
        return like.save();
    }

    async unlike(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            songRecommendationId: options.contentId,
        };
        return LikeModel.findOneAndRemove(query);
    }

    async save(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const saveModel = new SaveModel({
            userId: options.userId,
            songRecommendationId: options.contentId,
        });
        return saveModel.save();
    }

    async unsave(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            songRecommendationId: options.contentId,
        };
        return SaveModel.findOneAndRemove(query);
    }
}

export default new SongRecommendationService();
