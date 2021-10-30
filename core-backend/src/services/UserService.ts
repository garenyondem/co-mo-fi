import { UserModel } from '../models/User';
import { User } from '../types/User_pb';
import logger from '../utils/Logger';
import { notEmpty } from '../utils/Helpers';
import { status } from 'grpc';
import CoreServiceError from '../utils/Error';
import { SaveModel } from '../models/Save';
import { Save } from '../types/Save_pb';
import { FollowModel } from '../models/Follow';
import { Error, Types } from 'mongoose';
import {
    convertToProtoPlace,
    convertToProtoHighlightedPost,
    convertToProtoFeedPost,
    convertToProtoUser,
    convertToProtoEvent,
} from '../converters';
import { LinkedAccountModel } from '../models/LinkedAccount';
import { PlaceModel } from '../models/Place';
import { IPhotoSchema } from '../schemas/Photo';
import { LINKED_ACCOUNT_TYPE } from '../utils/Enums';
import { omitBy, isEmpty } from 'lodash';

interface ILinkedAccountListItem {
    name: string;
    profilePhoto?: IPhotoSchema;
    type: LINKED_ACCOUNT_TYPE;
    placeId?: Types.ObjectId;
}

class UserService {
    async getUserDetails(options: { userId: string }) {
        const userId = options.userId.toObjectId();
        const mongoUser = await UserModel.getDetailsById(userId);
        return convertToProtoUser(mongoUser);
    }

    async updateUserDetails(options: { userId: string; user: User.AsObject }) {
        // TODO: Replace User.AsObject with direct params of name, username etc.
        const { name, username, profilephoto } = options.user;
        try {
            const update = omitBy({ name, username, profilephoto }, isEmpty);
            await UserModel.findByIdAndUpdate(options.userId, update, {
                runValidators: true,
            });
            const updatedUser = await UserModel.getDetailsById(options.userId.toObjectId());
            if (updatedUser) {
                return convertToProtoUser(updatedUser);
            } else {
                return;
            }
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                let errMessage = '';
                if (err.errors?.username) {
                    errMessage = 'Username is already taken';
                }
                logger.info(errMessage);
                throw new CoreServiceError({ message: errMessage, code: status.ALREADY_EXISTS });
            } else {
                logger.error('Error while updating user details ', err);
                throw new CoreServiceError({ message: 'Error while updating user details', code: status.INTERNAL });
            }
        }
    }

    async getUserSaves(options: { userId: string; page: number }) {
        const userId = options.userId.toObjectId();

        const saves = await SaveModel.getSaves(userId, options.page);
        const interaction = { liked: false, saved: true };
        return saves
            .map((savedItem) => {
                const save = new Save();
                if (savedItem.highlightedPost?._id) {
                    const savedHighlightedPost = convertToProtoHighlightedPost(savedItem.highlightedPost, interaction);
                    save.setHighlightedpost(savedHighlightedPost);
                    save.setType(Save.SAVED_ITEM_TYPE.HIGHLIGHTED_POST);
                } else if (savedItem.feedPost?._id) {
                    const savedPost = convertToProtoFeedPost(savedItem.feedPost, interaction);
                    save.setPost(savedPost);
                    save.setType(Save.SAVED_ITEM_TYPE.POST);
                } else if (savedItem.event?._id) {
                    const savedEvent = convertToProtoEvent(savedItem.event, interaction, false);
                    save.setEvent(savedEvent);
                    save.setType(Save.SAVED_ITEM_TYPE.EVENT);
                } else {
                    return null;
                }
                return save;
            })
            .filter(notEmpty);
    }

    async getUserFollowedPlaces(options: { userId: string; page: number }) {
        const userId = options.userId.toObjectId();
        const follows = await FollowModel.getFollows(userId, options.page);
        return follows.map((follow) => {
            return convertToProtoPlace(follow.place, true);
        });
    }

    async removeSpotifyUrl(options: { userId: string }) {
        const update = { $unset: { 'externalProfileUrls.spotify': '' } };
        return UserModel.findByIdAndUpdate(options.userId, update);
    }

    async getLinkedAccountsMeta(options: { userId: string }): Promise<ILinkedAccountListItem[]> {
        const userId = options.userId.toObjectId();

        const linkedAccounts = await LinkedAccountModel.find({ userId });
        const query = {
            _id: { $in: linkedAccounts.map((x) => x.placeId) },
        };
        const placeMetas = await PlaceModel.find(query).select({ name: 1, profilePhoto: 1 });
        return placeMetas.map((x) => ({
            name: x.name,
            profilePhoto: x.profilePhoto,
            type: LINKED_ACCOUNT_TYPE.LINKED_ACCOUNT_TYPE_PLACE,
            placeId: x._id,
        }));
    }

    async getUserAccountMeta(options: { userId: string }): Promise<ILinkedAccountListItem> {
        const userMeta = await UserModel.findById(options.userId).select({ name: 1, profilePhoto: 1 });
        if (!userMeta) {
            throw new CoreServiceError({ code: status.INVALID_ARGUMENT });
        }
        return {
            name: userMeta.name,
            profilePhoto: userMeta.profilePhoto,
            type: LINKED_ACCOUNT_TYPE.LINKED_ACCOUNT_TYPE_USER,
        };
    }

    async insertToLinkedAccount(options: { userId: string; placeId: string }) {
        const link = new LinkedAccountModel();
        link.placeId = options.placeId.toObjectId();
        link.userId = options.userId.toObjectId();
        return link.save();
    }
}

export default new UserService();
