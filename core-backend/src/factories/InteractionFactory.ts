import { LIKEABLE_CONTENT_TYPE, SAVEABLE_CONTENT_TYPE } from '../utils/Enums';
import FeedPostService from '../services/FeedPostService';
import { Types } from 'mongoose';
import EventService from '../services/EventService';
import SongRecommendationService from '../services/SongRecommendationService';
import HighlightedPostService from '../services/HighlightedPostService';

interface ILikeInteraction {
    increaseLikeCount(options: { contentId: Types.ObjectId }): Promise<any>;
    decreaseLikeCount(options: { contentId: Types.ObjectId }): Promise<any>;
    like(options: { userId: Types.ObjectId; contentId: Types.ObjectId }): Promise<any>;
    unlike(options: { userId: Types.ObjectId; contentId: Types.ObjectId }): Promise<any>;
}

interface ISaveInteraction {
    increaseSaveCount(options: { contentId: Types.ObjectId }): Promise<any>;
    decreaseSaveCount(options: { contentId: Types.ObjectId }): Promise<any>;
    save(options: { userId: Types.ObjectId; contentId: Types.ObjectId }): Promise<any>;
    unsave(options: { userId: Types.ObjectId; contentId: Types.ObjectId }): Promise<any>;
}

export class InteractionFactory {
    initializeLike(options: { type: LIKEABLE_CONTENT_TYPE }): ILikeInteraction | undefined {
        switch (options.type) {
            case LIKEABLE_CONTENT_TYPE.FEED_POST:
                return FeedPostService;
            case LIKEABLE_CONTENT_TYPE.SONG_RECOMMENDATION:
                return SongRecommendationService;
            case LIKEABLE_CONTENT_TYPE.EVENT:
                return EventService;
            default:
                console.log('Unsupported likeable content type');
                break;
        }
    }
    initializeSave(options: { type: SAVEABLE_CONTENT_TYPE }): ISaveInteraction | undefined {
        switch (options.type) {
            case SAVEABLE_CONTENT_TYPE.FEED_POST:
                return FeedPostService;
            case SAVEABLE_CONTENT_TYPE.SONG_RECOMMENDATION:
                return SongRecommendationService;
            case SAVEABLE_CONTENT_TYPE.EVENT:
                return EventService;
            case SAVEABLE_CONTENT_TYPE.HIGHLIGHTED_POST:
                return HighlightedPostService;
            default:
                console.log('Unsupported saveable content type');
                break;
        }
    }
}
