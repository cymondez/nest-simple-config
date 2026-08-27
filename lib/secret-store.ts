export interface SecretCredential {
    account: string;
    password: string;
}

export interface SecretStore {
    getPassword(service: string, account: string): Promise<string | null>;
    setPassword(service: string, account: string, password: string): Promise<void>;
    deletePassword(service: string, account: string): Promise<boolean>;
    findCredentials(service: string): Promise<SecretCredential[]>;
}
