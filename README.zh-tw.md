# 🔧 NestJS Simple Config

**[English](./README.md) | 繁體中文**

> **注意**: 本套件先前以 `@mediaedge4tw/nest-simple-config` 發布。由於組織變更，已遷移至新位置。

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <strong>為 NestJS 應用程式提供強大、輕量且靈活的配置模組</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nest-simple-config">
    <img src="https://img.shields.io/npm/v/nest-simple-config.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/nest-simple-config">
    <img src="https://img.shields.io/npm/l/nest-simple-config.svg" alt="Package License" />
  </a>
  <a href="https://www.npmjs.com/package/nest-simple-config">
    <img src="https://img.shields.io/npm/dm/nest-simple-config.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/cymondez/nest-simple-config">
    <img src="https://img.shields.io/github/stars/cymondez/nest-simple-config.svg?style=social&label=Star" alt="GitHub Stars" />
  </a>
</p>

## ✨ 為什麼選擇 NestJS Simple Config？

靈感來自 ASP.NET Core 的配置系統，此模組為您的 NestJS 應用程式帶來熟悉且強大的配置管理：

### 🚀 **[簡單直觀](#-基本配置)**
- **易於設定** 支援 JSON 和 YAML
- **零學習曲線** 對熟悉 ASP.NET Core 的開發者而言
- **最小依賴** 和輕量化架構

### 🔄 **[多配置支援](#-配置覆蓋)**
- **多配置檔案** 具可自定義的優先順序
- **環境特定** 配置 (dev, staging, prod)
- **靈活覆蓋** 系統適用於不同部署場景

### 🐳 **[容器就緒](#-環境變數覆蓋)**
- **完美支援 Docker** 和 Kubernetes 部署
- **執行期配置** 使用環境變數覆蓋
- **階層式配置** 支援點記法
- **清晰的優先順序**: 命令列 → 環境變數 → 配置檔案

### 🔒 **[型別安全配置](#-型別化配置選項)**
- **選項注入** 針對配置區段
- **編譯期型別檢查** 使用 TypeScript
- **執行期驗證** 使用 class-validator 裝飾器

### 🖥️ **[命令列支援](#-命令列配置)**
- **命令列參數** 解析用於動態配置
- **巢狀配置** 透過點記法 (--database.host=localhost)
- **陣列支援** 使用索引記法 (--servers.0.name=web1)
- **執行期覆蓋** 具最高優先權，適用於部署靈活性

### 🗝️ **[OS Secret 配置](#-os-secret-配置)**
- 將敏感值儲存在作業系統秘密管理員（透過 keytar）
- 安全的映射檔（JSON/YAML/YML）只含帳號參考，絕不含敏感值
- 管理 CLI 支援 set/get/remove/list/clear
- 適用本地開發，正式環境仍用環境變數或專用 vault

## 📦 安裝

```bash
npm i --save nest-simple-config
```

## 🚀 基本配置

### 使用配置檔案設定

建立您的配置檔案：

**appsettings.json**

```json
{
    "a": "base",
    "b": {
        "c": 123
    }
}
```

**在您的 AppModule 中匯入：**

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from 'nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
        }
    })
  ],
})
export class AppModule {}
```

**在您的服務中注入配置：**

```ts
@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {}

  getA() {
    return this.config.get('a'); // 取得字串: 'base'
  }

  getC() {
    return this.config.get('b.c'); // 取得數字: 123
  }

  getSection() {
    return this.config.get('b'); // 取得物件: { c : 123}
  }
}
```

## 🐳 環境變數覆蓋

非常適合容器化部署！設定環境變數在執行期覆蓋您的配置：

```sh
# 前綴為 NestApp，物件路徑分隔符號為 '__'
export NestApp__a='env'
export NestApp__b__c=789
```

在 AppModule 中匯入，並設定 envConfig

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from 'nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
      },
      envOptions: {
          prefix: 'NestApp', // 這是預設值
      },
    })
  ],
})
export class AppModule {}
```

取得覆蓋後的值

```ts
@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {}

  getA() {
    return this.config.get('a'); // 取得字串: 'env'
  }

  getC() {
    return this.config.get('b.c'); // 取得數字: 789
  }
}
```

## 🖥️ 命令列配置

**✨ 新功能**: 命令列參數支援在配置階層中具有最高優先權！

非常適合在 CI/CD 管線、Docker 容器和部署腳本中進行動態配置。命令列參數會自動覆蓋 JSON 配置檔案和環境變數。

### 基本命令列使用

```sh
# 使用命令列配置啟動您的應用程式
node dist/main.js --database.host=prod-server --database.port=5432 --debug=true
```

### 巢狀配置支援

命令列參數支援使用點記法的巢狀物件，自動對應到您的 JSON 配置結構：

**appsettings.json**
```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "credentials": {
      "username": "dev",
      "password": "dev123"
    }
  },
  "server": {
    "port": 3000,
    "ssl": false
  }
}
```

**命令列覆蓋：**
```sh
# 覆蓋巢狀配置值
node dist/main.js \
  --database.host=production-db \
  --database.port=5432 \
  --database.credentials.username=prod_user \
  --database.credentials.password=secure_pass \
  --server.ssl=true
```

### 陣列配置

使用索引記法配置陣列：

**appsettings.json**
```json
{
  "servers": [],
  "tags": ["default"]
}
```

**使用陣列的命令列：**
```sh
# 使用索引記法配置陣列
node dist/main.js \
  --servers.0.name=web1 \
  --servers.0.host=192.168.1.10 \
  --servers.0.port=8080 \
  --servers.1.name=web2 \
  --servers.1.host=192.168.1.11 \
  --servers.1.port=8080 \
  --tags.0=production \
  --tags.1=web \
  --tags.2=nodejs
```

**結果配置：**
```json
{
  "servers": [
    { "name": "web1", "host": "192.168.1.10", "port": 8080 },
    { "name": "web2", "host": "192.168.1.11", "port": 8080 }
  ],
  "tags": ["production", "web", "nodejs"]
}
```

### 使用命令列支援設定

使用 `forRoot()` 時會自動包含命令列配置：

```ts
import { Module } from '@nestjs/common';
import { SimpleConfigModule } from 'nest-simple-config';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
        filename: join(__dirname, 'appsettings.json')
      },
      envOptions: {
        prefix: 'App'
      }
      // 命令列提供者會自動包含！
    })
  ],
})
export class AppModule {}
```

### 使用建構器的自訂配置

對於進階控制，使用配置建構器：

```ts
import { Module } from '@nestjs/common';
import { 
  SimpleConfigModule, 
  JsonConfigurationProvider, 
  EnvConfigurationProvider,
  CommandlineConfigurationProvider 
} from 'nest-simple-config';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRootWithConfigBuilder((builder) => {
      builder
        .add(new JsonConfigurationProvider(join(__dirname, 'appsettings.json')))
        .add(new JsonConfigurationProvider(join(__dirname, `appsettings.${process.env.NODE_ENV}.json`), true))
        .add(new EnvConfigurationProvider({ prefix: 'App' }))
        .add(new CommandlineConfigurationProvider()); // 最高優先權
    })
  ],
})
export class AppModule {}
```

### 配置優先順序

命令列參數在配置階層中具有 **最高優先權**：

1. **🥇 命令列** (`--key=value`) - **最高優先權**
2. **🥈 環境變數** (`APP__key=value`)
3. **🥉 配置檔案** (`appsettings.json`)

```ts
@Injectable()
export class ConfigService {
  constructor(private readonly config: Configuration) {}

  getDatabaseHost() {
    // 優先順序：CLI 參數 → ENV 變數 → JSON 檔案
    return this.config.get('database.host');
  }
}
```

### 布林值和數值

命令列參數會自動解析為適當的型別：

```sh
# 布林旗標
node dist/main.js --debug --verbose=false --production=true

# 數值
node dist/main.js --port=3000 --timeout=5000 --retries=3

# 字串值 (預設)
node dist/main.js --environment=production --log-level=info
```

```ts
// 使用正確型別存取解析後的值
config.get('debug');        // boolean: true
config.get('verbose');      // string: "false" 
config.get('production');   // string: "true"
config.get('port');         // number: 3000
config.get('timeout');      // number: 5000
config.get('environment');  // string: "production"
```

## 🔄 配置覆蓋

### 陣列覆蓋模式

選擇配置被覆蓋時陣列的合併方式：

appsettings.json

```json
{
  "ary": [ 1, 2, 3 ]
}
```

appsettings.override.json
```json
{
  "ary": [ 11, 22 ]
}
```

在 AppModule 中匯入，並設定 envConfig

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule } from 'nest-simple-config'
import { join } from 'path';
@Module({
  imports: [
    SimpleConfigModule.forRoot({
      arrayMergeMode: 'all', // 'section' 或 'all'
      configFileOptions: {
            filename: join(__dirname,'appsettings.json'),
      },
      envOptions: {
          prefix: 'NestApp', // 這是預設值
      },
    })
  ],
})
export class AppModule {}
```

取得覆蓋後的陣列

```ts
@Injectable()
export class OtherService {
  constructor(private readonly config: Configuration) {

  }
  
  // 如果選擇 'section'，ary 為 [11, 22, 3]
  // 如果選擇 'all'，ary 為 [11, 22]
  getAry() {
    return this.config.get('ary'); 
  }
}
```

### 使用 ConfigurationBuilder

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, SimpleConfigModule, DefaultEnvOptions
        ,JsonConfigurationProvider, EnvConfigurationProvider } from 'nest-simple-config'
import { join } from 'path';
@Module({
  imports: [SimpleConfigModule.forRootWithConfigBuilder((builder) => {

      builder.add(new JsonConfigurationProvider(join(__dirname, 'settings', 'appsettings.json')))
              .add(new JsonConfigurationProvider(join(__dirname, 'settings', `appsettings.${process.env.NODE_ENV}.json`), true))
              .add(new EnvConfigurationProvider({prefix: 'App'}));
  })],
})
export class AppModule {}
```

## �️ OS Secret 配置

> **✨ 新功能**: 將敏感值儲存在作業系統秘密管理員（macOS Keychain、Windows 認證保險箱、Linux libsecret）中，透過 [keytar](https://github.com/atom/node-keytar) 存取。映射檔只保存帳號參考，絕不保存敏感值。

### 為什麼使用 OS Secret 配置？

本地開發常需要機密（資料庫密碼、API 金鑰），這些**絕不**應提交到版本控制。OS Secret 配置讓您保留安全、可共享的映射檔，實際值則存於作業系統憑證存放區。

### Linux 前置需求

在 Linux 上，`keytar` 需要 `libsecret` 與 D-Bus 工作階段：

```bash
# Debian/Ubuntu
sudo apt-get install libsecret-1-dev gnome-keyring

# Fedora/RHEL
sudo dnf install libsecret-devel

# 無頭/CI 環境啟動 D-Bus 工作階段
eval $(dbus-launch --sh-syntax)
```

### Secret Key 檔案格式

Secret key 檔案將配置屬性對應到 keytar 帳號名稱。支援 JSON、YAML 與 YML。檔案**只含帳號參考**，絕不含敏感值。

**appsettings.secrets.json**（JSON）

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

**appsettings.secrets.yaml**（YAML）

```yaml
database:
  username: database.username
  password: database.password

jwt:
  secret: jwt.secret
```

兩種格式產生相同的 keytar 查詢（`service: your-package-name`，`account: database.password`），並解析為一般配置物件：

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

### 使用 `forRoot()` 設定

```ts
import { SimpleConfigModule } from 'nest-simple-config';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
        filename: join(__dirname, 'appsettings.json'),
      },
      secretConfigFileOptions: {
        filename: join(__dirname, 'appsettings.secrets.json'),
      },
    }),
  ],
})
export class AppModule {}
```

YAML 範例：

```ts
SimpleConfigModule.forRoot({
  secretConfigFileOptions: {
    fileType: 'yaml',
    filename: join(__dirname, 'appsettings.secrets.yaml'),
  },
});
```

覆蓋 keytar service（預設為您的 `package.json` `name`）：

```ts
SimpleConfigModule.forRoot({
  secretConfigFileOptions: {
    filename: join(__dirname, 'appsettings.secrets.json'),
    service: 'shared-development-secrets',
  },
});
```

### 使用 `forRootWithConfigBuilder()` 設定

```ts
import {
  SimpleConfigModule,
  JsonConfigurationProvider,
  JsonSecretConfigurationProvider,
  YamlSecretConfigurationProvider,
  EnvConfigurationProvider,
  CommandlineConfigurationProvider,
} from 'nest-simple-config';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRootWithConfigBuilder((builder) => {
      builder
        .add(new JsonConfigurationProvider(join(__dirname, 'appsettings.json')))
        .add(new JsonSecretConfigurationProvider(join(__dirname, 'appsettings.secrets.json')))
        .add(new EnvConfigurationProvider({ prefix: 'App' }))
        .add(new CommandlineConfigurationProvider());
    }),
  ],
})
export class AppModule {}
```

### 配置優先順序

當提供 `secretConfigFileOptions` 時，`forRoot()` 的預設優先順序為：

1. **📁 配置檔案**（`appsettings*.json` / `.yaml`）
2. **🗂️ Secret 配置**（keytar 支撐的映射檔）
3. **🌍 環境變數**（`APP__key=value`）
4. **🖥️ 命令列**（`--key=value`）— **最高**

Secret 覆蓋配置檔案，環境變數覆蓋 secret，命令列參數維持最高優先權。

### 檔案類型解析

1. 明確指定 `fileType` 時一律使用指定格式。
2. 未指定時，從 `.json`、`.yaml` 或 `.yml` 副檔名推斷。
3. filename 無已識別副檔名時預設使用 JSON 並補上 `.json`。
4. 明確 `fileType` 與副檔名衝突時拋出錯誤。

預設值：

```ts
{
  filename: 'appsettings.secrets',
  rootPath: '.',
  fileType: 'json',
  optional: true,
}
```

### 缺少帳號與檔案

- **缺少 keytar 帳號**：自然略過。不報錯，不以 `undefined` 覆蓋較早 provider 的值。
- **選用的 secret 檔案不存在**（`optional: true`，預設）：回傳空 object。
- **必要的 secret 檔案不存在**（`optional: false`）：拋出 missing-file 錯誤。

### Service 解析

keytar `service` 依下列順序解析：

1. 明確的 API/CLI 值（`secretConfigFileOptions.service` / `--service`）。
2. 從 `process.cwd()` 向上尋找最近的 `package.json` `name`。
3. 兩者皆無時拋出錯誤。

Scoped package 名稱（如 `@company/my-api`）完整保留不改寫。

### Secret 管理 CLI

本套件安裝 `nest-simple-config` CLI 用於管理 secrets：

```bash
# 儲存或取代 secret
nest-simple-config secrets set database.password

# 檢查 secret 是否存在（預設遮罩值）
nest-simple-config secrets get database.password
nest-simple-config secrets get database.password --reveal

# 移除單一 secret
nest-simple-config secrets remove database.password

# 列出已設定的帳號（絕不印出密碼）
nest-simple-config secrets list

# 移除該 service 下全部帳號
nest-simple-config secrets clear
```

覆蓋 service：

```bash
nest-simple-config secrets set database.password --service shared-development-secrets
```

使用 `set` 但未提供位置參數值時，CLI 會以隱藏輸入讀取。CLI 輸出絕不包含 secret 值，除非明確使用 `get --reveal`。

## �🔒 型別化配置選項

> **✨ 增強功能**: 為您的配置物件提供增強的型別安全和驗證。

對於需要強型別和驗證的應用程式，您可以使用帶有 class-validator 裝飾器的型別化配置選項。

#### 定義配置類別

首先，建立帶有驗證裝飾器的配置類別：

```ts
// database-options.ts
import { IsString, IsInt, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BindOption } from 'nest-simple-config';

export class ConnectionPoolOptions {
    @IsInt()
    @Min(1)
    @Max(100)
    min!: number;

    @IsInt()
    @Min(1)
    @Max(500)
    max!: number;

    @IsOptional()
    @IsInt()
    @Min(1000)
    timeout?: number;
}

@BindOption('database')
export class DatabaseOptions {
    @IsString()
    host!: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    port!: number;

    @IsString()
    username!: string;

    @IsString()
    password!: string;

    @IsString()
    database!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ConnectionPoolOptions)
    pool?: ConnectionPoolOptions;
}
```

```ts
// server-options.ts
import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { BindOption } from 'nest-simple-config';

@BindOption('server')
export class ServerOptions {
    @IsString()
    host!: string;

    @IsInt()
    @Min(1)
    port!: number;

    @IsOptional()
    @IsBoolean()
    ssl?: boolean;

    @IsOptional()
    @IsString()
    environment?: string;
}
```

#### 配置檔案

建立具有對應結構的配置檔案：

```json
// appsettings.json
{
    "database": {
        "host": "localhost",
        "port": 5432,
        "username": "admin",
        "password": "secret123",
        "database": "myapp",
        "pool": {
            "min": 5,
            "max": 20,
            "timeout": 30000
        }
    },
    "server": {
        "host": "0.0.0.0",
        "port": 3000,
        "ssl": true,
        "environment": "production"
    }
}
```

#### 在模組中註冊選項

在您的模組中註冊型別化配置選項：

```ts
import { Module } from '@nestjs/common';
import { SimpleConfigModule } from 'nest-simple-config';
import { DatabaseOptions } from './config/database-options';
import { ServerOptions } from './config/server-options';
import { join } from 'path';

@Module({
  imports: [
    SimpleConfigModule.forRoot({
      configFileOptions: {
        filename: join(__dirname, 'appsettings.json')
      }
    }),
    SimpleConfigModule.registerOptions([DatabaseOptions, ServerOptions])
  ],
})
export class AppModule {}
```

#### 注入型別化配置

使用 `@InjectConfig` 裝飾器注入強型別配置：

```ts
import { Injectable } from '@nestjs/common';
import { InjectConfig, Options } from 'nest-simple-config';
import { DatabaseOptions } from './config/database-options';
import { ServerOptions } from './config/server-options';

@Injectable()
export class MyService {
    constructor(
        @InjectConfig(DatabaseOptions) private readonly dbConfig: Options<DatabaseOptions>,
        @InjectConfig(ServerOptions) private readonly serverConfig: Options<ServerOptions>
    ) {}

    getDatabaseConnectionString(): string {
        const db = this.dbConfig.value;
        return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
    }

    getServerUrl(): string {
        const server = this.serverConfig.value;
        const protocol = server.ssl ? 'https' : 'http';
        return `${protocol}://${server.host}:${server.port}`;
    }

    getDatabaseConfig(): DatabaseOptions {
        return this.dbConfig.value; // 完全型別化且已驗證
    }
}
```

#### 優勢

- **型別安全**: 完整的 TypeScript 支援與編譯期型別檢查
- **驗證**: 使用 class-validator 裝飾器自動驗證
- **自動完成**: IDE 對配置屬性的支援
- **執行期錯誤**: 對無效配置提供清晰的錯誤訊息
- **巢狀物件**: 支援複雜的巢狀配置結構

## 🤝 貢獻

我們歡迎貢獻！如果您有改進想法或發現任何問題：

- 🐛 **回報錯誤** 透過開啟 [issue](https://github.com/cymondez/nest-simple-config/issues)
- 💡 **建議功能** 或改進
- 🔧 **提交 pull request** 修復錯誤或新功能

## 📧 支援

如果您覺得這個套件有幫助，請考慮：
- ⭐ **在 GitHub 上給此儲存庫加星**
- 📢 **與其他開發者分享**
- 💬 **在 [Issues](https://github.com/cymondez/nest-simple-config/issues) 區段回報問題** 或提問

## 授權

[MIT 授權](LICENSE)。
