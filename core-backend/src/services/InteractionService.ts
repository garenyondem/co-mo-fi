import { LikeModel } from '../models/Like';
import { SaveModel } from '../models/Save';
import { FollowModel } from '../models/Follow';
import SpotifyService from './SpotifyService';
import SongRecommendationService from './SongRecommendationService';
import { InteractionFactory } from '../factories/InteractionFactory';
import { LIKEABLE_CONTENT_TYPE, SAVEABLE_CONTENT_TYPE } from '../utils/Enums';
import { Types } from 'mongoose';

async function likeExists(userId: Types.ObjectId, contentId: Types.ObjectId): Promise<boolean> {
    const query = {
        userId,
        $or: [{ postId: contentId }, { songRecommendationId: contentId }, { eventId: contentId }],
    };
    const count = await LikeModel.countDocuments(query).limit(1);
    return count > 0;
}

async function saveExists(userId: Types.ObjectId, contentId: Types.ObjectId): Promise<boolean> {
    const query = {
        userId,
        $or: [
            { postId: contentId },
            { highlightedPostId: contentId },
            { songRecommendationId: contentId },
            { eventId: contentId },
        ],
    };
    const count = await SaveModel.countDocuments(query).limit(1);
    return count > 0;
}
class InteractionService {
    async toggleLike(options: { userId: string; postId?: string; songRecommendationId?: string; eventId?: string }) {
        const userId = options.userId.toObjectId();
        const contentId = options.postId || options.songRecommendationId || options.eventId;
        if (!contentId) {
            return;
        }

        let contentType: LIKEABLE_CONTENT_TYPE;
        if (options.postId) {
            contentType = LIKEABLE_CONTENT_TYPE.FEED_POST;
        } else if (options.songRecommendationId) {
            contentType = LIKEABLE_CONTENT_TYPE.SONG_RECOMMENDATION;
        } else if (options.eventId) {
            contentType = LIKEABLE_CONTENT_TYPE.EVENT;
        } else {
            return;
        }

        const interactionFactory = new InteractionFactory();
        const interaction = interactionFactory.initializeLike({ type: contentType });
        const exists = await likeExists(userId, contentId.toObjectId());
        if (exists) {
            // unlike
            return Promise.all([
                interaction?.decreaseLikeCount({ contentId: contentId.toObjectId() }),
                interaction?.unlike({ userId, contentId: contentId.toObjectId() }),
            ]);
        } else {
            // like
            return Promise.all([
                interaction?.increaseLikeCount({ contentId: contentId.toObjectId() }),
                interaction?.like({ userId, contentId: contentId.toObjectId() }),
            ]);
        }
    }

    async toggleSave(options: {
        userId: string;
        postId?: string;
        songRecommendationId?: string;
        highlightedPostId?: string;
        eventId?: string;
    }) {
        const userId = options.userId.toObjectId();
        const contentId =
            options.postId || options.songRecommendationId || options.highlightedPostId || options.eventId;
        if (!contentId) {
            return;
        }

        let contentType: SAVEABLE_CONTENT_TYPE;
        if (options.postId) {
            contentType = SAVEABLE_CONTENT_TYPE.FEED_POST;
        } else if (options.songRecommendationId) {
            contentType = SAVEABLE_CONTENT_TYPE.SONG_RECOMMENDATION;
        } else if (options.eventId) {
            contentType = SAVEABLE_CONTENT_TYPE.EVENT;
        } else if (options.highlightedPostId) {
            contentType = SAVEABLE_CONTENT_TYPE.HIGHLIGHTED_POST;
        } else {
            return;
        }

        const interactionFactory = new InteractionFactory();
        const interaction = interactionFactory.initializeSave({ type: contentType });
        const exists = await saveExists(userId, contentId.toObjectId());

        if (exists) {
            // unlike
            return Promise.all([
                interaction?.decreaseSaveCount({ contentId: contentId.toObjectId() }),
                interaction?.unsave({ userId, contentId: contentId.toObjectId() }),
            ]);
        } else {
            // like
            return Promise.all([
                interaction?.increaseSaveCount({ contentId: contentId.toObjectId() }),
                interaction?.save({ userId, contentId: contentId.toObjectId() }),
            ]);
        }
    }
    async toggleFollow(options: { userId: string; placeId: string }) {
        const userId = options.userId.toObjectId();
        const placeId = options.placeId.toObjectId();

        const query = {
            userId,
            placeId,
        };
        const exists = await FollowModel.countDocuments(query).limit(1);
        if (exists) {
            // unfollow
            return FollowModel.findOneAndRemove(query);
        } else {
            //follow
            const follow = new FollowModel();
            follow.userId = userId;
            follow.placeId = placeId;
            return follow.save();
        }
    }

    async insertSongRecommendation(options: { userId: string; songId: string; placeId: string }) {
        const songDetails = await SpotifyService.getSongDetails({ userId: options.userId, songId: options.songId });
        return SongRecommendationService.insertSongRecommendation({
            userId: options.userId,
            placeId: options.placeId,
            songDetails,
        });
    }
}

export default new InteractionService();
