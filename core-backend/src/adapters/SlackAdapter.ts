import { WebClient, WebAPICallResult, ChatPostMessageArguments, WebClientOptions, LogLevel } from '@slack/web-api';
import config from '../config';

export enum Channel {
    ALERTS = 'alerts',
    TECH = 'tech',
}

export enum IconEmoji {
    ALERT = ':rotating_light:',
    TADA = ':tada:',
    WRENCH = ':wrench:',
    THUMBSUP = ':thumbsup:',
    THUMBSDOWN = ':thumbsdown:',
}

class SlackAdapter {
    private slackClient: WebClient;
    private slackClientOptions: WebClientOptions = {
        logLevel: LogLevel.ERROR,
    };
    constructor(slackToken: string) {
        this.slackClient = new WebClient(slackToken, this.slackClientOptions);
    }
    async sendMessage(options: { text: string; channel: Channel; icon?: IconEmoji }): Promise<WebAPICallResult> {
        return this.slackClient.chat.postMessage({
            channel: options.channel,
            text: options.text,
            as_user: options.icon ? false : undefined,
            icon_emoji: options.icon,
        } as ChatPostMessageArguments);
    }
}

export default new SlackAdapter(config.slackToken);
