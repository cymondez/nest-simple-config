import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveSecretService } from '../../../lib/utils/secret-service-resolver';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-test-'));
}

function writePackage(targetDir: string, content: string): void {
    fs.writeFileSync(path.join(targetDir, 'package.json'), content, 'utf8');
}

describe('resolveSecretService', () => {
    let tmpRoot: string;

    beforeEach(() => {
        tmpRoot = makeTmpDir();
    });

    afterEach(() => {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('uses an explicitly provided service even when a package.json exists', () => {
        writePackage(tmpRoot, JSON.stringify({ name: 'package-name' }));
        expect(resolveSecretService('explicit-service', tmpRoot)).toBe('explicit-service');
    });

    it('preserves a scoped package name without rewriting', () => {
        writePackage(tmpRoot, JSON.stringify({ name: '@company/my-scoped-api' }));
        expect(resolveSecretService(undefined, tmpRoot)).toBe('@company/my-scoped-api');
    });

    it('searches upward from a nested directory to the nearest package.json', () => {
        writePackage(tmpRoot, JSON.stringify({ name: 'outer-package' }));
        const innerDir = path.join(tmpRoot, 'packages', 'nested', 'deep');
        fs.mkdirSync(innerDir, { recursive: true });
        expect(resolveSecretService(undefined, innerDir)).toBe('outer-package');
    });

    it('continues upward when a package.json has no name field', () => {
        const middleDir = path.join(tmpRoot, 'middle');
        fs.mkdirSync(middleDir, { recursive: true });
        writePackage(middleDir, JSON.stringify({ version: '1.0.0' }));
        writePackage(tmpRoot, JSON.stringify({ name: 'named-root' }));
        const leafDir = path.join(middleDir, 'leaf');
        fs.mkdirSync(leafDir, { recursive: true });
        expect(resolveSecretService(undefined, leafDir)).toBe('named-root');
    });

    it('throws on an empty explicit service string', () => {
        expect(() => resolveSecretService('   ', tmpRoot)).toThrow(/must not be empty/);
    });

    it('throws on a malformed package.json', () => {
        writePackage(tmpRoot, '{ not json }');
        expect(() => resolveSecretService(undefined, tmpRoot)).toThrow(/Unable to read project package file/);
    });

    it('throws when no package.json with a name can be found', () => {
        expect(() => resolveSecretService(undefined, tmpRoot)).toThrow(
            /Unable to determine the secret service/,
        );
    });
});