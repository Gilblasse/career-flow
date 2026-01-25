export class CaptchaDetectedError extends Error {
    constructor(message = 'CAPTCHA detected') {
        super(message);
        this.name = 'CaptchaDetectedError';
    }
}

export class TransientError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientError';
    }
}
