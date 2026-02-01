export class CaptchaDetectedError extends Error {
    constructor(message = 'CAPTCHA detected') {
        super(message);
        this.name = 'CaptchaDetectedError';
    }
}

export class UserTakeoverError extends Error {
    constructor(message = 'User takeover detected') {
        super(message);
        this.name = 'UserTakeoverError';
    }
}

export class TransientError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientError';
    }
}
