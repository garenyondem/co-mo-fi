export enum MONGOOSE_EVENT {
    CONNECTED = 'connected',
    ERROR = 'error',
    DISCONNECTED = 'disconnected',
    RECONNECTION_FAILED = 'reconnectFailed',
    CLOSE = 'close',
}

export enum USER_TYPE {
    STANDARD = 0,
    EMPLOYEE,
    EMPLOYER,
}

export enum ROLE_TYPE {
    STANDARD = 0,
    EMPLOYEE,
    EMPLOYER,
    ADMIN,
}

export enum CACHE_KEY {
    APP_CONFIG = 'app_config',
}

export enum LOCATION_TYPE {
    POINT = 'Point',
}

export enum HIGHLIGHTED_POST_TYPE {
    PLACE = 0,
    EVENT,
    MISC,
}

export enum OS {
    IOS = 0,
    ANDROID,
}

export enum NODE_ENV {
    DEVELOPMENT = 'development',
    STAGING = 'staging',
    TEST = 'test',
    PRODUCTION = 'production',
}

export enum DISTANCE_UNITS {
    IMPERIAL = 0,
    METRIC,
}

export enum USER_VERIFICATION_TYPE {
    EMAIL = 0,
    SMS,
}

export enum LINKED_ACCOUNT_TYPE {
    LINKED_ACCOUNT_TYPE_USER = 0,
    LINKED_ACCOUNT_TYPE_PLACE,
}

export enum SPOTIFY_SEARCH_TYPE {
    ALBUM = 'album',
    ARTIST = 'artist',
    TRACK = 'track',
}

export enum LIKEABLE_CONTENT_TYPE {
    FEED_POST = 0,
    SONG_RECOMMENDATION,
    EVENT,
}

export enum SAVEABLE_CONTENT_TYPE {
    FEED_POST = 0,
    SONG_RECOMMENDATION,
    EVENT,
    HIGHLIGHTED_POST,
}

export enum READABLE_STREAM_EVENT {
    CLOSE = 'close',
    DATA = 'data',
    END = 'end',
    ERROR = 'error',
    READABLE = 'readable',
}

export enum GRPC_METHOD_TYPE {
    UNARY = 'unary',
    SERVER_STREAM = 'serverStream',
    CLIENT_STREAM = 'clientStream',
    BIDIRECTIONAL = 'bidirectional',
    UNKNOWN = 'unknown',
}
