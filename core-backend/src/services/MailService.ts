import nanoid from 'nanoid';
import handlebars from 'handlebars';
import fs from 'fs';
import { promisify } from 'util';
import MailAdapter from '../adapters/MailAdapter';
import config from '../config';

const readFile = promisify(fs.readFile);

class MailService {
    async sendVerificationMail(userName: string, email: string) {
        const token = nanoid(12);
        const path = `${process.cwd()}/mail-templates/mail-verification.hbs`;
        const link = `${config.emailActivationUrl}/${token}`;

        const source = await readFile(path, 'utf8');
        const template = handlebars.compile(source, { strict: true });
        const html = template({ link });

        const info = await MailAdapter.sendVerificationMail({
            from: 'Coffee & Moode & Fidelity <no-reply@verification.core.technology>',
            to: [email],
            subject: `${userName}, please verify your Coffee & Moode & Fidelity account`,
            html: html,
        });
        return { successful: !!info, verificationToken: token };
    }
}

export default new MailService();
