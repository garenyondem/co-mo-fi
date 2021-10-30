import jwt from 'jsonwebtoken';

export class JwtAdapter {
    private readonly algorithms = {
        HS256: 'HS256',
        HS512: 'HS512',
    };
    private readonly issuer = 'core.technology.backend';
    private secret: string;
    constructor(secret: string) {
        this.secret = secret;
    }
    private generateToken(payload: object, expiresIn: string, algorithm: string): Promise<string> {
        return new Promise((resolve) => {
            jwt.sign(payload, this.secret, { expiresIn, algorithm, issuer: this.issuer }, (err, encoded) => {
                if (!err) {
                    resolve(encoded);
                } else {
                    throw err;
                }
            });
        });
    }
    generateAccessToken(payload: object, expiresIn: string): Promise<string> {
        return this.generateToken(payload, expiresIn, this.algorithms.HS256);
    }
    generateRefreshToken(payload: object = {}, expiresIn: string): Promise<string> {
        return this.generateToken(payload, expiresIn, this.algorithms.HS512);
    }
}
