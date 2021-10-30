import FetchAdapter from '../adapters/FetchAdapter';
import { ISpotifyToken, SpotifyTokenModel } from '../models/SpotifyToken';
import CoreServiceError from '../utils/Error';
import { status } from 'grpc';
import { mapToCamelCaseObject } from '../utils/Helpers';
import { Song } from '../types/Song_pb';
import config from '../config';
import { Types } from 'mongoose';
import { SPOTIFY_SEARCH_TYPE } from '../utils/Enums';
import { convertToProtoSong } from '../converters';
import logger from '../utils/Logger';
import { ISongSchema } from '../schemas/Song';

// TODO: Separate these interfaces from service
interface ISpotifyImage {
    height: number;
    width: number;
    url: string;
}
interface ISpotifyAlbum {
    id: string;
    name: string;
    images: ISpotifyImage[];
    artists: ISpotifyArtist[];
}
interface ISpotifyTrack {
    album: ISpotifyAlbum;

    artists: ISpotifyArtist[];
    external_urls: { spotify: string };
    id: string;
    name: string;
}
interface ISpotifyArtist {
    id: string;
    name: string;
    popularity: number;
    genres: string[];
    external_urls: { spotify: string };
}

interface ISpotifySearchResponse {
    tracks: { items: ISpotifyTrack[] };
    artists: { items: ISpotifyArtist[] };
    albums: { items: ISpotifyAlbum[] };
}

interface ISpotifyUserToken {
    accessToken: string;
    tokenType: string;
    refreshToken: string;
    expiresIn: number;
}

function authHeaders({ tokenType, accessToken }: ISpotifyToken): { Authorization: string } {
    return { Authorization: `${tokenType} ${accessToken}` };
}

class SpotifyService {
    private readonly SPOTIFY_SEARCH_EP = 'https://api.spotify.com/v1/search';
    private readonly SPOTIFY_TOKEN_EP = 'https://accounts.spotify.com/api/token';
    private readonly SPOTIFY_TRACK_EP = 'https://api.spotify.com/v1/tracks/{id}';
    private readonly SPOTIFY_ARTIST_EP = 'https://api.spotify.com/v1/artists/{id}';

    private async getNewAccessToken({ refreshToken }: { refreshToken: string }) {
        const appCredentials = `${config.spotify.clientId}:${config.spotify.clientSecret}`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${appCredentials}`).toString('base64')}`,
        };
        const body = `grant_type=refresh_token&refresh_token=${refreshToken}`;
        const response = await FetchAdapter.post(this.SPOTIFY_TOKEN_EP, body, headers);
        return mapToCamelCaseObject<ISpotifyUserToken>(response);
    }

    private async updateUserToken({
        oldToken,
        newTokenData,
    }: {
        oldToken: ISpotifyToken;
        newTokenData: ISpotifyUserToken;
    }) {
        // Update existing document
        const date = new Date();
        date.setSeconds(date.getSeconds() + newTokenData.expiresIn);
        oldToken.accessToken = newTokenData.accessToken;
        oldToken.tokenType = newTokenData.tokenType;
        oldToken.expiresAt = date;
        return oldToken.save();
    }

    private async getUpToDateToken(options: { userId: Types.ObjectId }): Promise<ISpotifyToken> {
        const spotifyToken = await SpotifyTokenModel.findOne({ userId: options.userId });
        const currentDate = new Date();
        if (!spotifyToken) {
            // User did not auth with Spotify ever
            throw new CoreServiceError({ message: 'Missing Spotify authorization', code: status.NOT_FOUND });
        }
        try {
            if (currentDate > spotifyToken.expiresAt) {
                // token has expired - needs to be refreshed
                const freshTokenData = await this.getNewAccessToken({ refreshToken: spotifyToken.refreshToken });
                return this.updateUserToken({
                    oldToken: spotifyToken,
                    newTokenData: freshTokenData,
                });
            } else {
                // token is still valid
                return spotifyToken;
            }
        } catch (err) {
            // TODO: we weren't able to refresh this token, remove it from db.
            // Our refreshtoken has expired or user did revoke our access
            // User has to reauthenticate with us
            throw new CoreServiceError({
                message: 'Missing Spotify authentication',
                code: status.FAILED_PRECONDITION,
            });
        }
    }

    async searchForSongRecommendation(options: { userId: string; text: string }): Promise<Song[]> {
        const spotifyResponse = await this.search({
            ...options,
            ...{ types: [SPOTIFY_SEARCH_TYPE.TRACK], silenceTokenError: false },
        });
        if (!spotifyResponse) {
            logger.error('Could not get any response from Spotify for song recommendation search.');
            throw new CoreServiceError({ message: 'Error while getting search results', code: status.INTERNAL });
        }
        return spotifyResponse.tracks.items.map((track) => {
            const artistNames = track.artists.map((x) => x.name).join(', ');
            const [smallestCover] = track.album.images.sort((x, y) => {
                return x.width - y.width;
            });
            return convertToProtoSong({
                name: track.name,
                cover: smallestCover.url,
                artist: artistNames,
                spotifySongId: track.id,
                externalUrl: track.external_urls.spotify,
            } as ISongSchema);
        });
    }

    async searchGenresForPlaceFilter(options: { userId: string; text: string }): Promise<string[]> {
        // artist -> get genre
        // track -> get first artist from array -> get genre
        let genres: string[] = [];

        const spotifyResponse = await this.search({
            ...options,
            ...{ types: [SPOTIFY_SEARCH_TYPE.ARTIST, SPOTIFY_SEARCH_TYPE.TRACK], silenceTokenError: true },
        });
        if (!spotifyResponse) {
            return genres;
        }

        const { tracks, artists } = spotifyResponse;

        if (artists?.items?.length) {
            genres.push(...artists.items[0].genres);
        }
        if (tracks?.items?.length) {
            const artistId = tracks.items[0].artists[0].id;
            const artistDetails = await this.getArtistDetails({ userId: options.userId, artistId });
            if (artistDetails) {
                genres.push(...artistDetails.genres);
            }
        }

        const uniqueValues = [...new Set(genres)];
        return uniqueValues;
    }

    private async search(options: {
        userId: string;
        text: string;
        types: SPOTIFY_SEARCH_TYPE[];
        silenceTokenError: boolean;
    }): Promise<ISpotifySearchResponse | undefined> {
        const userId = options.userId.toObjectId();
        try {
            const spotifyToken = await this.getUpToDateToken({ userId });
            const url =
                `${this.SPOTIFY_SEARCH_EP}?q=${encodeURIComponent(options.text)}` +
                `&type=${encodeURIComponent(options.types.join(','))}`;
            return FetchAdapter.get<ISpotifySearchResponse>(url, authHeaders(spotifyToken));
        } catch (err) {
            if (options.silenceTokenError) {
                return {} as ISpotifySearchResponse;
            } else {
                throw err;
            }
        }
    }

    private async getArtistDetails(options: { userId: string; artistId: string }): Promise<ISpotifyArtist | undefined> {
        const userId = options.userId.toObjectId();
        const spotifyToken = await this.getUpToDateToken({ userId });
        if (!spotifyToken) {
            throw new CoreServiceError({ message: 'Missing Spotify authorization', code: status.NOT_FOUND });
        }
        const url = this.SPOTIFY_ARTIST_EP.replace('{id}', options.artistId);
        return FetchAdapter.get<ISpotifyArtist>(url, authHeaders(spotifyToken));
    }

    async getSongDetails(options: { userId: string; songId: string }): Promise<ISongSchema> {
        const userId = options.userId.toObjectId();
        const spotifyToken = await this.getUpToDateToken({ userId });
        if (!spotifyToken) {
            throw new CoreServiceError({ message: 'Missing Spotify authorization', code: status.NOT_FOUND });
        }
        const url = this.SPOTIFY_TRACK_EP.replace('{id}', options.songId);
        const track = await FetchAdapter.get<ISpotifyTrack>(url, authHeaders(spotifyToken));
        if (!track) {
            throw new CoreServiceError({ message: 'Missing Spotify authentication', code: status.FAILED_PRECONDITION });
        }
        const artistNames = track.artists.map((x) => x.name).join(', ');
        const [biggestCover] = track.album.images
            .sort((x, y) => {
                return x.width - y.width;
            })
            .reverse();
        const song: ISongSchema = {
            name: track.name,
            artist: artistNames,
            cover: biggestCover.url,
            spotifySongId: track.id,
            externalUrl: track.external_urls.spotify,
        };
        return song;
    }

    async disconnect(options: { userId: string }): Promise<any> {
        const userId = options.userId.toObjectId();
        return SpotifyTokenModel.remove({ userId });
    }
}

export default new SpotifyService();
