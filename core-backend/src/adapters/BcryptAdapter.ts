import { compare, hash } from 'bcrypt';

class BcryptAdapter {
    private readonly saltRounds = 8;
    hash(password: string): Promise<string> {
        return hash(password, this.saltRounds);
    }

    verify(password: string, hash: string): Promise<boolean> {
        return compare(password, hash);
    }
}

export default new BcryptAdapter();
