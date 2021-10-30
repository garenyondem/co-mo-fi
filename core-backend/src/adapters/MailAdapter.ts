// @ts-ignore
import mailgun from 'mailgun.js';
import config from '../config';

class MailAdapter {
    private mgClient: any;
    private mgEuDomain = 'https://api.eu.mailgun.net';
    private domains = {
        verification: 'verification.core.technology',
    };

    constructor(apiKey: string) {
        this.mgClient = mailgun.client({
            username: 'api',
            key: apiKey,
            url: this.mgEuDomain,
        });
    }
    sendVerificationMail(options: {
        from: string;
        to: string[];
        subject: string;
        text?: string;
        html?: string;
    }): Promise<any> {
        return new Promise((resolve, reject) => {
            this.mgClient.messages
                .create(this.domains.verification, options)
                .then(resolve)
                .catch(reject);
        });
    }
}

export default new MailAdapter(config.mail.mailgun.apiKey);
