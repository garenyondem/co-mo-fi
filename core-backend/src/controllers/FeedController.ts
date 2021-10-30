import { sendUnaryData, ServerUnaryCall, status } from 'grpc';
import { Empty } from '../types/Empty_pb';
import logger from '../utils/Logger';
import {
    NewPostRequest,
    FeedRequest,
    FeedResponse,
    HighlightsRequest,
    HighlightsResponse,
    EditPostRequest,
    NewHighlightRequest,
} from '../types/FeedService_pb';
import { HighlightedPost } from '../types/HighlightedPost_pb';
import FeedService from '../services/FeedService';
import CoreServiceError from '../utils/Error';
import { ITokenData } from '../interfaces';

export interface IFeedController {
    newPost(call: ServerUnaryCall<NewPostRequest>, callback: sendUnaryData<Empty>): Promise<any>;
    editPost(call: ServerUnaryCall<EditPostRequest>, callback: sendUnaryData<Empty>): Promise<any>;

    feed(call: ServerUnaryCall<FeedRequest & ITokenData>, callback: sendUnaryData<FeedResponse>): Promise<any>;

    highlights(call: ServerUnaryCall<HighlightsRequest>, callback: sendUnaryData<HighlightsResponse>): Promise<any>;
    newHighlight(call: ServerUnaryCall<NewHighlightRequest>, callback: sendUnaryData<Empty>): Promise<any>;
}

export class FeedController implements IFeedController {
    async newPost(call: ServerUnaryCall<NewPostRequest>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Feed new post');
        const res = new Empty();
        const post = call.request.getPost();

        try {
            if (!post) {
                throw new CoreServiceError({ message: 'Missing post', code: status.INVALID_ARGUMENT });
            }
            const postObject = post.toObject();
            const insertedPost = await FeedService.insertPost({ post: postObject });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async editPost(call: ServerUnaryCall<EditPostRequest>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Feed edit post');
        const res = new Empty();
        const post = call.request.getPost();

        try {
            if (!post) {
                throw new CoreServiceError({ message: 'Missing post', code: status.INVALID_ARGUMENT });
            }
            const postObject = post.toObject();
            const editedPost = await FeedService.editPost({ post: postObject });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }

    async feed(call: ServerUnaryCall<FeedRequest & ITokenData>, callback: sendUnaryData<FeedResponse>): Promise<any> {
        logger.info('Feed list');
        const page = call.request.getPage();
        const userId = call.request.userId;
        const res = new FeedResponse();

        const posts = await FeedService.getPosts({ userId, page });
        res.setPostsList(posts);

        return callback(null, res);
    }

    async highlights(
        call: ServerUnaryCall<HighlightsRequest & ITokenData>,
        callback: sendUnaryData<HighlightsResponse>
    ): Promise<any> {
        logger.info('Highlighted post list');
        const page = call.request.getPage();
        const userId = call.request.userId;
        const res = new HighlightsResponse();

        const highlightedPosts = await FeedService.getHighlightedPosts({ userId, page });
        res.setHighlightsList(highlightedPosts);

        return callback(null, res);
    }

    async newHighlight(call: ServerUnaryCall<NewHighlightRequest>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('New highlighted post');
        const highlightedPost = call.request.getHighlight() as HighlightedPost;
        const res = new Empty();

        const insertedHighlightedPost = await FeedService.insertHighlightedPost({
            highlightedPost: highlightedPost.toObject(),
        });

        return callback(null, res);
    }
}
