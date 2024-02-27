export class ConfigValidateException extends Error {
    constructor(message: string, public readonly providerMessages: string[] = []) {
        const msg = `${message}\nerror providers:\n\t${providerMessages.join('\n\t')}`;
        super(msg);
    }
}