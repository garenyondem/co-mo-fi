import dotenv from 'dotenv';

const envFound = dotenv.config();
if (!envFound) {
    console.error("Couldn't find .env file or is not specified");
    process.exit();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT ? +process.env.PORT : 6677;

export default {
    nodeEnv: process.env.NODE_ENV,
    servicePort: PORT,
    coreDBUri: process.env.CORE_MONGO_URI || '',
    spotify: {
        callbackUrl: process.env.SPOTIFY_CALLBACK_URL || '',
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    },
    jwtSecrets: {
        mobile: {
            accessToken: process.env.MOBILE_ACCESS_TOKEN_SECRET || '',
            refreshToken: process.env.MOBILE_REFRESH_TOKEN_SECRET || '',
        },
    },
};
