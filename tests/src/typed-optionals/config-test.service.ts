import { Injectable } from '@nestjs/common';
import { InjectConfig, Options } from '../../../lib';
import { DatabaseOptions } from './database-options';
import { ServerOptions } from './server-options';

@Injectable()
export class ConfigTestService {
    constructor(
        @InjectConfig(DatabaseOptions) private readonly dbConfig: Options<DatabaseOptions>,
        @InjectConfig(ServerOptions) private readonly serverConfig: Options<ServerOptions>
    ) {}

    getDatabaseConfig(): DatabaseOptions {
        return this.dbConfig.value;
    }

    getServerConfig(): ServerOptions {
        return this.serverConfig.value;
    }

    getConnectionString(): string {
        const db = this.dbConfig.value;
        return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
    }

    getServerUrl(): string {
        const server = this.serverConfig.value;
        const protocol = server.ssl ? 'https' : 'http';
        return `${protocol}://${server.host}:${server.port}`;
    }
}
