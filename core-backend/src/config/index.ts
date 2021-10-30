import dotenv from 'dotenv';
import { NODE_ENV } from '../utils/Enums';

const envFound = dotenv.config();
if (!envFound) {
    console.error("Couldn't find .env file or is not specified");
    process.exit();
}

process.env.NODE_ENV = process.env.NODE_ENV || NODE_ENV.DEVELOPMENT;

export default {
    nodeEnv: process.env.NODE_ENV,
    servicePort: process.env.PORT || '50052',
    coreDBUri: process.env.CORE_MONGO_URI || '',
    spotifyAuthenticationUrl: process.env.SPOTIFY_AUTHENTICATION_URL || '',
    emailActivationUrl: process.env.EMAIL_ACTIVATION_URL || '',
    slackToken: process.env.SLACK_TOKEN || '',
    jwtSecrets: {
        mobile: {
            accessToken: process.env.MOBILE_ACCESS_TOKEN_SECRET || '',
            refreshToken: process.env.MOBILE_REFRESH_TOKEN_SECRET || '',
        },
    },
    mail: {
        mailgun: {
            apiKey: process.env.MAILGUN_API_KEY || '',
            domain: process.env.MAILGUN_DOMAIN || '',
        },
    },
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    },
    aws: {
        s3Region: process.env.S3_REGION || '',
        accessKeyId: process.env.IAM_USER_KEY || '',
        secretAccessKey: process.env.IAM_USER_SECRET || '',
    },
};
