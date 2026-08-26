import * as fs from 'fs';
import * as path from 'path';

export function resolveSecretService(service?: string, startPath = process.cwd()): string {
    if (service !== undefined) {
        if (service.trim().length === 0) {
            throw new Error('Secret service must not be empty.');
        }

        return service;
    }

    let currentPath = path.resolve(startPath);

    while (true) {
        const packageFilename = path.join(currentPath, 'package.json');

        if (fs.existsSync(packageFilename)) {
            let packageObject: { name?: unknown };

            try {
                packageObject = JSON.parse(fs.readFileSync(packageFilename, 'utf8')) as { name?: unknown };
            } catch (error) {
                const packageError = new Error(`Unable to read project package file: ${packageFilename}`);
                (packageError as Error & { cause?: unknown }).cause = error;
                throw packageError;
            }

            if (typeof packageObject.name === 'string' && packageObject.name.trim().length > 0) {
                return packageObject.name;
            }
        }

        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }

    throw new Error('Unable to determine the secret service. Specify service or add a name to package.json.');
}
