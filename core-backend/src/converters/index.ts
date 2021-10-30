import { IPhotoSchema } from '../schemas/Photo';
import { Photo } from '../types/Photo_pb';
import { IFeedPost } from '../models/FeedPost';
import { Post } from '../types/Post_pb';
import { IPlace } from '../models/Place';
import { Author } from '../types/Author_pb';
import { IHighlightedPost } from '../models/HighlightedPost';
import { HighlightedPost } from '../types/HighlightedPost_pb';
import { Place } from '../types/Place_pb';
import getDistance from '../utils/GeoDistance';
import { IPointSchema } from '../schemas/Point';
import { Point } from '../types/Point_pb';
import { Event } from '../types/Event_pb';
import { IGenre } from '../models/Genre';
import { Genre } from '../types/Genre_pb';
import { Timeframe } from '../types/Timeframe_pb';
import { ITimeframeSchema } from '../schemas/Timeframe';
import { Song } from '../types/Song_pb';
import { sample } from 'lodash';
import { SongRecommendation } from '../types/PlacesService_pb';
import { User } from '../types/User_pb';
import { IUser } from '../models/User';
import { ExternalProfileUrls } from '../types/ExternalProfileUrls_pb';
import { IExternalProfileSchema } from '../schemas/ExternalProfileUrl';
import { ISongRecommendation } from '../models/SongRecommendation';
import { ISongSchema } from '../schemas/Song';
import { LinkedAccount } from '../types/LinkedAccount_pb';
import { LINKED_ACCOUNT_TYPE, LOCATION_TYPE } from '../utils/Enums';
import { IRole } from '../models/Role';
import { Role, RoleAttributes } from '../types/Role_pb';
import { Types } from 'mongoose';
import { IEvent } from '../models/Event';
const nowPlayingTestData = require('./../../nowPlayingTestData.json');

interface IInteraction {
    liked: boolean;
    saved: boolean;
}

interface IDistanceOption {
    unit: string;
}

interface IRoleAttributes {
    place: { [key: string]: boolean };
    feed: { [key: string]: boolean };
}

function convertToMongoPhoto(photo: Photo.AsObject): IPhotoSchema {
    return {
        original: photo.original,
        thumbnails: photo.thumbnailsList,
    } as IPhotoSchema;
}

function convertToMongoLocation(point: Point.AsObject): IPointSchema {
    return {
        type: LOCATION_TYPE.POINT,
        coordinates: [point.lon, point.lat],
    };
}

function convertToMongoTimeframe(timeframe: Timeframe.AsObject): ITimeframeSchema {
    return {
        day: timeframe.day,
        start: timeframe.start,
        end: timeframe.end,
    } as ITimeframeSchema;
}

function convertToProtoPhoto(mongoPhoto: IPhotoSchema): Photo {
    const photo = new Photo();
    photo.setOriginal(mongoPhoto.original);
    if (mongoPhoto.thumbnails) {
        photo.setThumbnailsList(mongoPhoto.thumbnails);
    }
    return photo;
}

function convertToProtoAuthor(mongoAuthor: IPlace): Author {
    const author = new Author();
    if (mongoAuthor.profilePhoto) {
        author.setPhoto(convertToProtoPhoto(mongoAuthor.profilePhoto));
    }
    author.setName(mongoAuthor.name);
    return author;
}

function convertToProtoFeedPost(mongoPost: IFeedPost, interaction: IInteraction) {
    const post = new Post();
    post.setPlaceid(mongoPost.placeId.toHexString());
    post.setText(mongoPost.text);
    post.setElapsedtime(mongoPost.createdAt.toElapsedTimeString());
    post.setPostid(mongoPost._id.toHexString());
    post.setLiked(interaction.liked);
    post.setSaved(interaction.saved);
    post.setAuthor(convertToProtoAuthor(mongoPost.author));
    post.setPhotosList((mongoPost.photos || []).map(convertToProtoPhoto));
    return post;
}

function convertToProtoHighlightedPost(
    mongoHighlightedPost: IHighlightedPost,
    interaction: IInteraction
): HighlightedPost {
    const highlightedPost = new HighlightedPost();
    highlightedPost.setPlaceid(mongoHighlightedPost.placeId.toHexString());
    highlightedPost.setText(mongoHighlightedPost.text);
    highlightedPost.setAuthor();
    highlightedPost.setEventid('temp-event-id'); // TODO: Event id implementation
    highlightedPost.setType(mongoHighlightedPost.type);
    highlightedPost.setHighlightedpostid(mongoHighlightedPost._id.toHexString());
    highlightedPost.setSaved(interaction.saved);
    highlightedPost.setPhotosList((mongoHighlightedPost.photos || []).map(convertToProtoPhoto));
    return highlightedPost;
}

// TODO: This may also be moved to a helper func
function getDistanceText(placeLocation: IPointSchema, userCoords: number[], distanceOption: IDistanceOption): string {
    const placeCoords = placeLocation.coordinates.reverse();
    const distanceToPlace = getDistance(userCoords, placeCoords, distanceOption);
    const distanceText = distanceToPlace == 0.0 ? 'near' : `${distanceToPlace} ${distanceOption.unit}`;
    return distanceText;
}

function convertToProtoLocation(mongoLocation: IPointSchema): Point {
    const point = new Point();
    const [lat, lon]: Array<number> = mongoLocation.coordinates;
    point.setLat(lat);
    point.setLon(lon);
    return point;
}

function convertToProtoGenre(mongoGenre: IGenre): Genre {
    const genre = new Genre();
    genre.setName(mongoGenre.name || '');
    if (mongoGenre._id) {
        genre.setGenreid(mongoGenre._id.toHexString());
    }
    return genre;
}

function convertToProtoTimeframe(mongoTimeframe: ITimeframeSchema): Timeframe {
    const timeframe = new Timeframe();
    timeframe.setDay(mongoTimeframe.day);
    timeframe.setStart(mongoTimeframe.start);
    timeframe.setEnd(mongoTimeframe.end);
    return timeframe;
}

function convertToProtoSong(mongoSong: ISongSchema): Song {
    const song = new Song();
    song.setExternalurl(mongoSong.externalUrl);
    song.setName(mongoSong.name);
    song.setCover(mongoSong.cover);
    song.setArtist(mongoSong.artist);
    song.setSongid(mongoSong.spotifySongId);
    return song;
}

function convertToProtoSongRecommendation(
    mongoSongRecommendation: ISongRecommendation,
    interaction: IInteraction
): SongRecommendation {
    const songRecommendation = new SongRecommendation();
    // @ts-ignore
    songRecommendation.setRecommendedby(mongoSongRecommendation.recommendedBy.name);
    songRecommendation.setSong(convertToProtoSong(mongoSongRecommendation.song));
    songRecommendation.setSongrecommendationid(mongoSongRecommendation._id.toString());
    songRecommendation.setLiked(interaction.liked);
    return songRecommendation;
}

function convertToProtoPlace(
    mongoPlace: IPlace,
    following: boolean,
    userCoords?: number[],
    distanceOption?: IDistanceOption
): Place {
    const place = new Place();
    place.setPlaceid(mongoPlace._id.toHexString());
    place.setName(mongoPlace.name);
    place.setDescription(mongoPlace.description || '');
    place.setPrice(mongoPlace.price);
    place.setRating((mongoPlace.rating || '').toString());
    place.setFollowing(following);
    if (userCoords && distanceOption) {
        place.setDistance(getDistanceText(mongoPlace.location, userCoords, distanceOption));
    }
    if (mongoPlace.location) {
        place.setLocation(convertToProtoLocation(mongoPlace.location));
    }
    place.setGenresList((mongoPlace.genreIds || []).map(convertToProtoGenre));
    place.setTimeframesList((mongoPlace.timeframes || []).map(convertToProtoTimeframe));
    place.setPhotosList((mongoPlace.photos || []).map(convertToProtoPhoto));
    if (mongoPlace.profilePhoto) {
        place.setProfilephoto(convertToProtoPhoto(mongoPlace.profilePhoto));
    }
    const sampleSong = sample(nowPlayingTestData.items);
    place.setNowplaying(convertToProtoSong(sampleSong));
    return place;
}

function convertToProtoExternalProfileUrls(externalProfiles: IExternalProfileSchema): ExternalProfileUrls {
    const externalProfileUrls = new ExternalProfileUrls();
    externalProfileUrls.setSpotify(externalProfiles.spotify);
    return externalProfileUrls;
}

function convertToProtoUser(mongoUser: IUser): User {
    const user = new User();
    user.setName(mongoUser.name);
    user.setUsername(mongoUser.username);
    user.setEmail(mongoUser.email);
    user.setUserid(mongoUser._id.toHexString());
    user.setType(mongoUser.type);
    user.setFavouritegenresList(mongoUser.favouriteGenres.map(convertToProtoGenre));
    if (mongoUser.externalProfileUrls) {
        user.setExternalprofileurls(convertToProtoExternalProfileUrls(mongoUser.externalProfileUrls));
    }
    if (mongoUser.profilePhoto) {
        user.setProfilephoto(convertToProtoPhoto(mongoUser.profilePhoto));
    }
    return user;
}

function convertToProtoLinkedAccount(mongoLinkedAccount: {
    name: string;
    profilePhoto?: IPhotoSchema;
    type: LINKED_ACCOUNT_TYPE;
    placeId?: Types.ObjectId;
}): LinkedAccount {
    const linkedAccount = new LinkedAccount();
    linkedAccount.setName(mongoLinkedAccount.name);
    if (mongoLinkedAccount.profilePhoto) {
        linkedAccount.setProfilephoto(convertToProtoPhoto(mongoLinkedAccount.profilePhoto));
    }
    linkedAccount.setType(mongoLinkedAccount.type);
    if (mongoLinkedAccount.placeId) {
        linkedAccount.setPlaceid(mongoLinkedAccount.placeId.toHexString());
    }
    return linkedAccount;
}

function convertToProtoRoleAttributes(mongoRoleAttributes: IRoleAttributes) {
    const roleAttibutes = new RoleAttributes();
    // place settings
    for (let [key, value] of Object.entries(mongoRoleAttributes.place)) {
        roleAttibutes.getPlaceMap().set(key, value);
    }
    // feed settings
    for (let [key, value] of Object.entries(mongoRoleAttributes.feed)) {
        roleAttibutes.getFeedMap().set(key, value);
    }
    return roleAttibutes;
}

function convertToProtoRole(mongoRole: IRole) {
    const role = new Role();
    role.setName(mongoRole.name);
    role.setType(mongoRole.type);
    role.setAttributes(convertToProtoRoleAttributes(mongoRole.attributes));
    return role;
}

function convertToProtoEvent(mongoEvent: IEvent, interaction: IInteraction, attendanceState: boolean): Event {
    const event = new Event();
    event.setTitle(mongoEvent.title);
    event.setLocation();
    event.setStartdatetime(mongoEvent.startDate.toUnixTimestamp());
    event.setEnddatetime(mongoEvent.endDate.toUnixTimestamp());
    event.setQuota(mongoEvent.quota);
    event.setAttending(attendanceState);
    event.setEventid(mongoEvent._id.toHexString());
    event.setPlaceid(mongoEvent.placeId.toHexString());
    event.setPhotosList((mongoEvent.photos || []).map(convertToProtoPhoto));
    event.setSaved(interaction.saved);
    return event;
}

export {
    convertToMongoPhoto,
    convertToMongoLocation,
    convertToMongoTimeframe,
    convertToProtoFeedPost,
    convertToProtoHighlightedPost,
    convertToProtoPlace,
    convertToProtoSong,
    convertToProtoSongRecommendation,
    convertToProtoUser,
    convertToProtoLinkedAccount,
    convertToProtoRole,
    convertToProtoEvent,
    convertToProtoGenre,
    convertToProtoPhoto,
};
