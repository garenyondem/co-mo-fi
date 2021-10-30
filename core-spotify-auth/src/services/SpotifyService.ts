import FetchAdapter from '../adapters/FetchAdapter';
import logger from '../utils/Logger';
import { mapToCamelCaseObject } from '../utils/Helpers';
import config from '../config';

export interface ISpotifyUserProfile {
    displayName: string;
    id: string;
    email: string;
    externalUrls: { spotify: string };
    images: [
        {
            height: number;
            width: number;
            url: string;
        }
    ];
}
export interface ISpotifyUserToken {
    accessToken: string;
    tokenType: string;
    refreshToken: string;
    expiresIn: number;
}

interface ISpotifyService {
    getAurhorizationUri(): string;
    getToken(authorizationCode: string): Promise<ISpotifyUserToken>;
    getUserProfile(tokenType: string, accessToken: string): Promise<ISpotifyUserProfile>;
}

class SpotifyService implements ISpotifyService {
    // TODO: move these endpoints into a constants file maybe?
    private SPOTIFY_AUTHORIZATION_SCOPES = [
        'user-top-read', // Read access to a user's top artists and tracks.
        'user-read-currently-playing', // Read access to a user’s currently playing track.
        'user-library-read', // Read access to a user's "Your Music" library.
        'playlist-read-private', // Read access to user's private playlists.
        'user-read-email', // Read access to user’s email address. (Profile)
    ];
    private SPOTIFY_AUTH_EP = 'https://accounts.spotify.com/authorize';
    private SPOTIFY_TOKEN_EP = 'https://accounts.spotify.com/api/token';
    private SPOTIFY_PROFILE_EP = 'https://api.spotify.com/v1/me';
    constructor() { }

    getAurhorizationUri(): string {
        return `${this.SPOTIFY_AUTH_EP}?response_type=code` +
            `&client_id=${config.spotify.clientId}` +
            `&scope=${encodeURIComponent(this.SPOTIFY_AUTHORIZATION_SCOPES.join(' '))}` +
            `&redirect_uri=${config.spotify.callbackUrl}`;
    }

    // Get refresh and access tokens
    async getToken(authorizationCode: string): Promise<ISpotifyUserToken> {
        logger.info('Spotify get access and refresh tokens');
        const appCredentials = `${config.spotify.clientId}:${config.spotify.clientSecret}`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${appCredentials}`).toString('base64')}`,
        };
        const body = `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${config.spotify.callbackUrl}`;
        const response = await FetchAdapter.post(this.SPOTIFY_TOKEN_EP, body, headers);
        return mapToCamelCaseObject(response) as ISpotifyUserToken;
    }

    async getUserProfile(tokenType: string, accessToken: string): Promise<ISpotifyUserProfile> {
        logger.info('Spotify get profile data');
        const response = await FetchAdapter.get(this.SPOTIFY_PROFILE_EP, {
            Authorization: `${tokenType} ${accessToken}`,
        });
        return mapToCamelCaseObject(response) as ISpotifyUserProfile;
    }
}

export default new SpotifyService();
