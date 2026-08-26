#!/usr/bin/env node

import { runSecretsCli } from './secrets-cli';

void runSecretsCli(process.argv.slice(2)).then(exitCode => {
    process.exitCode = exitCode;
});
