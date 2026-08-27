import { SecretCredential, SecretStore } from './secret-store';

interface KeytarModule extends SecretStore {}

class KeytarSecretStore implements SecretStore {
    private module?: KeytarModule;

    async getPassword(service: string, account: string): Promise<string | null> {
        return this.getModule().getPassword(service, account);
    }

    async setPassword(service: string, account: string, password: string): Promise<void> {
        return this.getModule().setPassword(service, account, password);
    }

    async deletePassword(service: string, account: string): Promise<boolean> {
        return this.getModule().deletePassword(service, account);
    }

    async findCredentials(service: string): Promise<SecretCredential[]> {
        return this.getModule().findCredentials(service);
    }

    private getModule(): KeytarModule {
        if (!this.module) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                this.module = require('keytar') as KeytarModule;
            } catch (error) {
                throw new Error(
                    'The optional "keytar" dependency is not installed. Install it (npm install keytar) to use the OS secret manager on this platform.',
                );
            }
        }
        return this.module;
    }
}

export const keytarSecretStore: SecretStore = new KeytarSecretStore();
