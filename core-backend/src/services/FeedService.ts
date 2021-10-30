import { Post } from '../types/Post_pb';
import { FeedPostModel } from '../models/FeedPost';
import { LikeModel } from '../models/Like';
import { SaveModel } from '../models/Save';
import { HighlightedPostModel } from '../models/HighlightedPost';
import { HighlightedPost } from '../types/HighlightedPost_pb';
import { convertToMongoPhoto, convertToProtoFeedPost, convertToProtoHighlightedPost } from '../converters';

class FeedService {
    async insertPost(options: { post: Post.AsObject }) {
        const photos = options.post.photosList.map(convertToMongoPhoto);
        const placeId = options.post.placeid;
        return FeedPostModel.insertFeedPost(placeId.toObjectId(), options.post.text, photos);
    }

    async editPost(options: { post: Post.AsObject }) {
        // TODO: User may add or remove photo to existing post by editing
        const update = {
            text: options.post.text,
        };
        return FeedPostModel.findByIdAndUpdate(options.post.postid, update);
    }

    async getPosts(options: { userId: string; page: number }) {
        const userId = options.userId.toObjectId();
        const posts = await FeedPostModel.getFeedList(options.page);
        const postIds = posts.map((x) => x._id);
        const [likeStates, saveStates] = await Promise.all([
            LikeModel.getLikeStatesOfPosts(postIds, userId),
            SaveModel.getSaveStatesOfPosts(postIds, userId),
        ]);

        return posts.map((mongoPost) => {
            const liked = likeStates.some((like) => {
                return like.postId.toHexString() === mongoPost._id.toHexString();
            });
            const saved = saveStates.some((save) => {
                return save.postId.toHexString() === mongoPost._id.toHexString();
            });
            return convertToProtoFeedPost(mongoPost, { liked, saved });
        });
    }

    async getHighlightedPosts(options: { userId: string; page: number }) {
        const userId = options.userId.toObjectId();

        const mongoHighlightedPosts = await HighlightedPostModel.getHighlightedPosts(options.page);
        const highlightedPostIds = mongoHighlightedPosts.map((post) => post._id);
        const saveStates = await SaveModel.getSaveStatesOfHighlightedPosts(highlightedPostIds, userId);

        return mongoHighlightedPosts.map((mongoHighlightedPost) => {
            const saved = saveStates.some((save) => {
                return save.highlightedPostId.toHexString() === mongoHighlightedPost._id.toHexString();
            });
            return convertToProtoHighlightedPost(mongoHighlightedPost, { liked: false, saved });
        });
    }

    async insertHighlightedPost(options: { highlightedPost: HighlightedPost.AsObject }) {
        const photos = options.highlightedPost.photosList.map(convertToMongoPhoto); // TODO: photos implementation - upload - test etc.
        const placeId = options.highlightedPost.placeid.toObjectId();
        const type = options.highlightedPost.type;
        const text = options.highlightedPost.text;
        const eventIdStr = options.highlightedPost.eventid;
        const eventId = eventIdStr?.length ? eventIdStr.toObjectId() : undefined;

        return HighlightedPostModel.insertHighlightedPost(text, type, placeId, eventId, photos);
    }
}

export default new FeedService();
