# OS Secret Configuration Implementation Handoff

## 1. Current status

- Branch: `codex/feature/os-secret-config`
- Repository package manager: **npm** (`package-lock.json` is the source of truth)
- No commit has been created for this feature.
- Implementation is **in progress and not ready to merge**.
- The agreed feature design is in [`DESIGN.secert-config.md`](./DESIGN.secert-config.md). Preserve the filename as-is unless the user asks to rename it.
- pnpm was used accidentally during the interrupted implementation. All project-local pnpm artifacts have since been removed:
  - `node_modules/`
  - `.pnpm-store/`
  - `pnpm-workspace.yaml`
  - No `pnpm-lock.yaml` remains.

## 2. Important operating constraints

1. **Do not use pnpm in this repository.**
2. The user's environment has `node`, `npm`, and `npx`. If they are not visible inside the sandbox, do not substitute another runtime or package manager. Ask the user before locating or invoking them outside the sandbox.
3. Ask before installing tools or dependencies.
4. Do not delete, rewrite, or revert existing implementation files without first inspecting the current diff.
5. Do not access a real OS credential store from the normal test suite. Use the injected `SecretStore` fake.
6. Do not commit changes unless the user explicitly asks for a commit.

## 3. Agreed behavior

- Secret mapping files support JSON, YAML, and YML.
- Mapping files contain configuration-property-to-keytar-account mappings, never secret values.
- Actual values are stored through keytar in the operating system secret manager.
- Provider order under `SimpleConfigModule.forRoot()` is:

  ```text
  appsettings files
  -> secret provider
  -> environment variables
  -> command-line arguments
  ```

- Missing keytar accounts are omitted naturally. They must not throw and must not overwrite an earlier provider with `undefined`.
- Secret values remain strings.
- The keytar `service` resolution order is:
  1. Explicit API/CLI value.
  2. Nearest valid `package.json.name`, searching upward from `process.cwd()`.
  3. Error when neither is available.
- Scoped package names are preserved exactly.
- Both convenience registration and manual builder registration are required:
  - `SimpleConfigModule.forRoot({ secretConfigFileOptions: ... })`
  - `forRootWithConfigBuilder(builder => builder.add(...))`
- Existing synchronous providers and `ConfigurationBuilder.build()` must remain backward compatible.
- CLI commands are `set`, `get`, `remove`, `list`, and `clear`; `--service` is optional and `get` reveals plaintext only with `--reveal`.

Refer to [`DESIGN.secert-config.md`](./DESIGN.secert-config.md) for full examples and acceptance behavior.

## 4. Work already implemented

### Async provider support

- Added `AsyncConfigurationProvider` in `lib/config-providers/config-provider.abstract.ts`.
- Added `ConfigurationBuilder.buildAsync()`.
- Async providers are awaited sequentially in insertion order.
- Provider validation still runs once per provider before merging, matching the original behavior.
- `build()` rejects marked async providers before invoking any provider.
- `build()` also detects legacy custom providers that return a thenable.
- The original `section` and `all` Lodash merge strategies are shared by sync and async builds.
- `SimpleConfigModule` preserves eager synchronous building when no async provider exists. When an async provider is present, `CONFIG_OBJECT` returns `builder.buildAsync()` from its Nest factory.

### Secret provider implementation

- Added `SecretStore` and `SecretCredential` interfaces in `lib/secret-store.ts`.
- Added a lazy keytar adapter in `lib/keytar-secret-store.ts`.
- Added:
  - `SecretConfigurationProvider`
  - `JsonSecretConfigurationProvider`
  - `YamlSecretConfigurationProvider`
- The provider currently:
  - Reads JSON or YAML account mappings.
  - Resolves the service once per load.
  - Recursively resolves object/array leaves.
  - Caches repeated account lookups during one load.
  - Preserves an empty-string secret as a valid value.
  - Omits missing accounts and empty branches.
  - Avoids including the underlying store error text in its public error message.
- Added module options and defaults for secret files.
- Added automatic JSON/YAML/YML selection and explicit file-type mismatch checks.
- Added service resolver in `lib/utils/secret-service-resolver.ts`.

### CLI implementation

- Added `lib/cli.ts` with a Node shebang.
- Added testable CLI logic in `lib/secrets-cli.ts`.
- Added package binary entry:

  ```json
  {
    "bin": {
      "nest-simple-config": "./dist/cli.js"
    }
  }
  ```

- CLI logic supports `set`, `get`, `remove`/`delete`, `list`, and `clear`.
- `list` prints account names only.
- `get` masks the value unless `--reveal` is present.
- Store failures use generic output that does not contain a secret value.

### Tests started

- Added `tests/src/in-memory-secret-store.ts`.
- Added JSON/YAML/YML and invalid mapping fixtures under `tests/src/settings/secrets/`.
- Added initial async builder tests:
  - Mixed sync/async provider ordering.
  - Sync build preflight rejection.
  - Bare thenable detection.
  - Array merge regression.
  - Per-provider validation.
- Added initial secret provider tests:
  - JSON loading.
  - YAML/YML equivalence.
  - Default package-name service.
  - Optional and required missing files.
  - Invalid mapping path.
  - Secret-safe provider error text.

## 5. Current working tree

### Modified tracked files

```text
lib/config-builder.ts
lib/config-common.ts
lib/config-providers/config-provider.abstract.ts
lib/config-providers/index.ts
lib/implements/default-options.ts
lib/index.ts
lib/interfaces/simple-config-optional.interface.ts
lib/simple-config.module.ts
package.json
```

### New implementation files

```text
lib/cli.ts
lib/config-providers/secret-config-provider.ts
lib/keytar-secret-store.ts
lib/secret-store.ts
lib/secrets-cli.ts
lib/utils/secret-service-resolver.ts
```

### New test files and fixtures

```text
tests/src/in-memory-secret-store.ts
tests/src/settings/secrets/appsettings.base.json
tests/src/settings/secrets/appsettings.secrets.json
tests/src/settings/secrets/appsettings.secrets.yaml
tests/src/settings/secrets/appsettings.secrets.yml
tests/src/settings/secrets/invalid.secrets.json
tests/unit/config-providers/secret-config-provider.spec.ts
tests/unit/configuration-builder-async.spec.ts
```

## 6. Validation performed so far

- A provisional `tsc --noEmit -p tsconfig.json` run passed after the main library implementation and initial type fixes.
- That check occurred before the final test additions and minor option-preservation change, so it **must be rerun**.
- Jest has **not** been run.
- Existing e2e tests have **not** been run.
- The CLI has **not** been exercised manually.
- The package has **not** been packed or installed as an npm package.
- No real keytar/OS credential-store test has been run.

## 7. Known issues requiring attention

### Must fix before testing

1. In `lib/interfaces/simple-config-optional.interface.ts`, the type-only `SecretStore` import currently appears at the bottom of the file. Move it to the top and rerun formatting/type-checking.
2. `package.json` contains the new keytar optional dependency, but `package-lock.json` has not been updated. Use the user's npm environment only after permission.
3. Review `readHiddenSecret()` in `lib/secrets-cli.ts`. The non-TTY `line` handler calls `reader.close()` before `resolve(line)`, while the `close` handler resolves an empty string. Reorder or guard settlement so piped input cannot resolve incorrectly.
4. The lazy keytar adapter should convert a missing optional dependency into a clear action-oriented error instead of exposing a raw `MODULE_NOT_FOUND` as its cause.
5. Run formatting after functional fixes. Existing project formatting is inconsistent, so limit formatting to files touched by this feature rather than rewriting unrelated files.

### Missing tests

1. `resolveSecretService()`:
   - Explicit service wins.
   - Scoped name is preserved.
   - Nearest package in a nested/monorepo layout wins.
   - Nameless package continues upward.
   - Empty explicit service, malformed package JSON, and no package name fail clearly.
2. CLI:
   - `set` with positional value and hidden input.
   - Masked and revealed `get`.
   - `remove`/`delete`.
   - Sorted `list` without password leakage.
   - `clear`.
   - Default service and `--service` override.
   - Invalid commands/accounts and store failures return code 1.
3. Nest/module integration:
   - JSON, `.yaml`, and `.yml` inference through `forRoot()`.
   - Filename without extension.
   - Explicit `fileType`/extension conflict.
   - Default optional secret file.
   - `optional: false` missing-file rejection.
   - File -> secret -> env -> CLI precedence.
   - Missing secret preserves the file value.
   - Async builder completion before `Configuration` and typed options are created.
4. Async builder:
   - Async rejection stops later providers.
   - `section` and `all` merge parity between sync and async paths.
   - Validator failure stops later providers and references the provider, not config values.
5. Provider edge cases:
   - Empty account string.
   - Scalar/null root.
   - Arrays and sparse results.
   - Store rejection does not start or leak later values unexpectedly.

### Documentation and packaging still missing

- Update `README.md` and `README.zh-tw.md` with JSON/YAML examples, priority, service defaults, CLI usage, and Linux keytar prerequisites.
- Update `CHANGELOG.md`.
- Confirm `.npmignore`/published files include `dist/cli.js`.
- Run `npm pack --dry-run` and inspect the binary entry.
- Decide whether keytar remains in `optionalDependencies`; the current implementation uses lazy loading specifically so normal library imports do not load the native addon.

## 8. Recommended continuation sequence

1. Read this handoff and `DESIGN.secert-config.md`, then inspect the current diff without rewriting it.
2. Fix the known TypeScript/import and hidden-input issues listed above.
3. With user permission, locate and use the user's existing `node`/`npm` tools outside the sandbox if necessary.
4. Update `package-lock.json` with npm; do not generate pnpm files.
5. Run the library TypeScript build and fix all compile errors.
6. Complete unit tests for the resolver and CLI.
7. Complete Nest integration/precedence tests.
8. Run all existing and new Jest tests with the repository's npm scripts.
9. Update English and Traditional Chinese documentation plus changelog.
10. Run lint/type-check/build and `npm pack --dry-run`.
11. Report the final diff and verification results to the user before committing.

## 9. Security notes

- Never print a secret value except for explicit CLI `get --reveal`.
- Do not include config objects in validator errors because they can contain resolved secrets.
- `keytar.findCredentials(service)` returns passwords with accounts. The CLI must immediately discard passwords when implementing `list` or `clear` output.
- Positional `set` values can remain in shell history/process arguments. Documentation should recommend omitting the positional value and using hidden input.
- Normal CI and tests must not assume an unlocked keychain, D-Bus session, Windows user vault, or macOS Keychain prompt.
- keytar is a native optional dependency and its upstream repository is archived; keep the `SecretStore` boundary intact.
