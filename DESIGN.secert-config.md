# OS Secret Configuration 支援

## Summary

新增符合現有 provider 架構的 OS Secret Configuration：

- Secret key file 支援 JSON、YAML 與 YML。
- 檔案只保存 config property 到 keytar account 的映射，不保存敏感值。
- 敏感值透過 keytar 儲存在 OS secret manager。
- 支援 `forRoot()` options 與 `forRootWithConfigBuilder()`。
- keytar service 預設使用目前專案的 `package.json.name`，也可主動指定。
- Provider 優先順序維持由加入順序決定。

## Public API

擴充 options：

```ts
export interface SecretConfigurationFileOptions {
  fileType?: "json" | "yaml";
  filename?: string;
  rootPath?: string;
  service?: string;
  optional?: boolean;
}

export interface SimpleConfigOptional {
  configFileOptions?: ConfigurationFileOptions;
  secretConfigFileOptions?: SecretConfigurationFileOptions;
  envOptions?: EnvironmentOptions;
}
```

JSON 用法：

```ts
SimpleConfigModule.forRoot({
  configFileOptions: {
    filename: join(__dirname, "appsettings.json"),
  },
  secretConfigFileOptions: {
    filename: join(__dirname, "appsettings.secrets.json"),
  },
});
```

YAML 用法：

```ts
SimpleConfigModule.forRoot({
  secretConfigFileOptions: {
    fileType: "yaml",
    filename: join(__dirname, "appsettings.secrets.yaml"),
  },
});
```

使用者可覆蓋 service：

```ts
secretConfigFileOptions: {
  filename: "appsettings.secrets.json",
  service: "shared-development-secrets",
}
```

## Secret Key File Formats

JSON：

```json
{
  "database": {
    "username": "database.username",
    "password": "database.password"
  },
  "jwt": {
    "secret": "jwt.secret"
  }
}
```

YAML：

```yaml
database:
  username: database.username
  password: database.password

jwt:
  secret: jwt.secret
```

兩種格式產生相同的 keytar 查詢：

```text
service: my-nest-api
account: database.password
```

取得後輸出一般 config object：

```json
{
  "database": {
    "username": "actual-username",
    "password": "actual-secret-value"
  },
  "jwt": {
    "secret": "actual-jwt-secret"
  }
}
```

所有 secret values 保持 keytar 回傳的字串型別。

## File Type Resolution

解析規則固定為：

1. 有指定 `fileType` 時使用指定格式。
2. 未指定時，從 `.json`、`.yaml` 或 `.yml` 副檔名推斷。
3. filename 沒有副檔名時，預設使用 JSON 並補上 `.json`。
4. 明確指定的 `fileType` 與 filename 副檔名衝突時拋出設定錯誤，避免使用錯誤 parser。

預設值：

```ts
{
  filename: "appsettings.secrets",
  rootPath: ".",
  fileType: "json",
  optional: true,
}
```

最終預設檔案為：

```text
./appsettings.secrets.json
```

新增與現有 provider 命名一致的 concrete providers：

```ts
new JsonSecretConfigurationProvider(filename, options);
new YamlSecretConfigurationProvider(filename, options);
```

共用的 `SecretConfigurationProvider` 負責：

- 遞迴走訪 account mappings。
- 呼叫 keytar。
- 移除找不到的 entries。
- 建立最後的局部 config object。

`forRoot()` 根據 file type 建立相應 provider；builder 使用者也可直接加入 concrete provider。

## Service Resolution

Provider 與 CLI 共用同一個 resolver：

1. API 或 CLI 明確指定的 `service`
2. 從 `process.cwd()` 向上尋找最近的 `package.json.name`
3. 找不到有效名稱時拋出錯誤，要求主動指定

例如：

```json
{
  "name": "@company/my-nest-api"
}
```

預設直接使用：

```text
@company/my-nest-api
```

Scoped package name 不做改寫。

Builder 主動指定：

```ts
builder.add(
  new JsonSecretConfigurationProvider("appsettings.secrets.json", {
    service: "shared-development-secrets",
  }),
);
```

## Provider Order

只有提供 `secretConfigFileOptions` 時，`forRoot()` 才加入 Secret provider。

預設順序：

```text
appsettings files
→ secret configuration
→ environment variables
→ command-line arguments
```

因此：

- Secret 覆蓋 appsettings。
- Environment variables 覆蓋 secrets。
- Command-line arguments 維持最高優先權。
- Builder 使用者仍可透過 `.add()` 順序自行控制。

找不到 keytar account 時自然略過：

- 不報錯。
- 不寫入 `undefined`。
- 不覆蓋較早 provider 的設定值。

Secret key file 不存在時：

- `optional: true` 回傳空 object。
- `optional: false` 拋出 missing-file error。
- JSON 與 YAML 使用相同行為。

## Async Compatibility

因 keytar API 為非同步，擴充既有 provider contract：

```ts
export abstract class ConfigurationProvider {
  abstract loadConfigObject(): any | Promise<any>;
}
```

新增：

```ts
ConfigurationBuilder.buildAsync(): Promise<any>;
```

行為：

- 現有同步 providers 不需修改。
- `build()` 保持同步及向後相容。
- `build()` 遇到 Promise 時拋出錯誤，要求使用 `buildAsync()`。
- `buildAsync()` 依 `.add()` 順序逐一 await、validate、merge。
- `SimpleConfigModule` 的 `CONFIG_OBJECT` 改用 async Nest factory 呼叫 `buildAsync()`。
- `forRoot()` 與 `forRootWithConfigBuilder()` 仍回傳 `DynamicModule`。
- Nest 會在建立 `Configuration` 與 typed options 前等待 secrets 載入完成。

## Secret Management CLI

新增：

```text
nest-simple-config secrets
```

指令：

```bash
nest-simple-config secrets set database.password
nest-simple-config secrets get database.password
nest-simple-config secrets remove database.password
nest-simple-config secrets list
nest-simple-config secrets clear
```

主動指定 service：

```bash
nest-simple-config secrets set database.password \
  --service shared-development-secrets
```

CLI 規則：

- `--service` 選填；預設解析目前 `package.json.name`。
- `set <account> [value]` 未提供 value 時使用隱藏輸入。
- `get` 預設只顯示是否存在；`--reveal` 才顯示明文。
- `list` 只顯示 accounts。
- `remove` 刪除單一 account。
- `clear` 刪除指定 service 下全部 accounts。
- CLI 不修改 JSON/YAML secret key file。
- log、錯誤與預設輸出不得包含 secret value。

## Test Plan

- 分別測試 JSON、YAML、YML secret key files。
- 驗證 file type 明確指定、副檔名推斷、無副檔名預設及格式衝突錯誤。
- 驗證 JSON 與 YAML 載入相同內容時產生相同 config object。
- Mock keytar，避免存取測試機的 OS secret manager。
- 驗證明確 service、`package.json.name` 預設值、scoped package name 與子目錄向上查找。
- 驗證缺少 account 時自然保留較早 provider 的值。
- 驗證 optional 與 required files。
- 驗證 file → secret → env → command-line 優先權。
- 驗證同步與非同步 providers 依加入順序合併。
- 驗證 validator 在完整 async build 後執行。
- 驗證 immutable configuration 與 typed options 能取得 secret values。
- 執行全部既有 e2e tests，確認同步 provider 與公開 API 向後相容。
- 測試 CLI service 預設值、主動覆蓋、所有管理指令及敏感值遮蔽。

## Assumptions

- JSON、YAML 與 YML 在第一版具備同等功能。
- Secret provider 必須透過 options 或 builder 明確加入。
- Service 預設是目前專案的 `package.json.name`。
- Secret key files 可以加入版本控制，因為其中只包含 account mappings。
- 本功能定位為本機開發 secrets；production 仍使用環境變數或專用 secret vault。
