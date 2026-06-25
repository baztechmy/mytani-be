// MODULES
import jwt from 'jsonwebtoken';
import ms from 'ms';

namespace Token {
    export type StringValue = ms.StringValue;

    export type Verified = { isValid: boolean, isExpired: boolean, payload?: any };
    export type Generated = { token: string, expiresAt: Date };

    export function generate(payload: any, secret: string, expiresIn: ms.StringValue): Token.Generated {
        const removeList = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];
        for (const key of removeList) {
            if ((payload as any)[key]) delete (payload as any)[key];
        }
        const token = jwt.sign(payload, secret, { expiresIn });
        const expiresAt = new Date(Date.now() + ms(expiresIn));

        return { token, expiresAt };
    }
    export function verify(token: string, secret: string): Token.Verified {
        try {
            const payload = jwt.verify(token, secret);
            return { isValid: true, isExpired: false, payload };
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') return { isValid: true, isExpired: true, payload: jwt.decode(token) };
            return { isValid: false, isExpired: false };
        }
    }
}

export default Token;
