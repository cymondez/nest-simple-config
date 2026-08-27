import { SecretCredential, SecretStore } from '../../lib';

export class InMemorySecretStore implements SecretStore {
    readonly calls: Array<{ operation: string; service: string; account?: string }> = [];
    private readonly services = new Map<string, Map<string, string>>();

    constructor(initialValues: Record<string, Record<string, string>> = {}) {
        Object.entries(initialValues).forEach(([service, values]) => {
            this.services.set(service, new Map(Object.entries(values)));
        });
    }

    async getPassword(service: string, account: string): Promise<string | null> {
        this.calls.push({ operation: 'get', service, account });
        return this.services.get(service)?.get(account) ?? null;
    }

    async setPassword(service: string, account: string, password: string): Promise<void> {
        this.calls.push({ operation: 'set', service, account });
        let values = this.services.get(service);
        if (!values) {
            values = new Map();
            this.services.set(service, values);
        }
        values.set(account, password);
    }

    async deletePassword(service: string, account: string): Promise<boolean> {
        this.calls.push({ operation: 'delete', service, account });
        return this.services.get(service)?.delete(account) ?? false;
    }

    async findCredentials(service: string): Promise<SecretCredential[]> {
        this.calls.push({ operation: 'list', service });
        return [...(this.services.get(service)?.entries() ?? [])].map(([account, password]) => ({
            account,
            password,
        }));
    }
}
