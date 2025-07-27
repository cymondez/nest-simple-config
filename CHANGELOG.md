# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-07-27

### Added
- **Command Line Configuration Support**: New `CommandlineConfigurationProvider` for parsing command line arguments
  - Supports dot notation for nested configurations (e.g., `--database.host=localhost`)
  - Supports array configurations (e.g., `--servers.0.name=web1 --servers.1.name=web2`)
  - Automatic integration with `SimpleConfigModule.forRoot()` and `SimpleConfigModule.forRootWithConfigBuilder()`
  - Highest priority in configuration hierarchy: Command Line → Environment Variables → Configuration Files

### Changed
- Enhanced `SimpleConfigModule` to automatically include `CommandlineConfigurationProvider` by default
- Improved package metadata for better discoverability

### Dependencies
- Added `minimist` for command line argument parsing
- Added `@types/minimist` for TypeScript support

### Documentation
- Added comprehensive command line configuration examples
- Updated README with detailed usage patterns and examples

### Testing
- Added comprehensive integration test suite for command line configuration
- Tests cover both `forRoot()` and `forRootWithConfigBuilder()` scenarios
- Validated array parsing, priority ordering, and nested configuration handling

## [2.0.0] - 2025-07-11

### Breaking Changes
- **Package Migration**: Migrated from `@mediaedge4tw/nest-simple-config` to `nest-simple-config`
- Updated package scope and repository references

### Added
- **Strongly-Typed Configuration Validation System**
  - Added typed configuration options with `@BindOption()` decorator
  - Implemented configuration validation with `class-validator`
  - Added immutable configuration support
- **Enhanced Configuration Features**
  - Configuration section immutability
  - Type-safe configuration access with dependency injection
  - Advanced configuration validation

### Changed
- Upgraded NestJS compatibility to support versions 8/9/10/11
- Optimized configuration immutability strategy for improved performance
- Enhanced error handling and validation messaging

### Dependencies
- Updated `@nestjs/common` and `@nestjs/core` peer dependencies
- Added `class-transformer` and `class-validator` for validation support

### Documentation
- Updated README with enhanced features documentation
- Added migration guide for package name change
- Added typed configuration examples

### Testing
- Added typed configuration integration tests
- Optimized test performance by reducing app initialization overhead
- Enhanced test coverage for validation scenarios

## [1.0.9] - 2025-07-11

### Changed
- Extended NestJS compatibility to support versions 8, 9, 10, and 11
- Upgraded `peerDependencies` for broader framework support
- Fixed `reflect-metadata` import issues

### Fixed
- Resolved ESLint TypeScript parser configuration issues
- Improved package compatibility across different NestJS versions

## [1.0.8] - 2024-02-28

### Added
- Configuration validation system
- Config validator settings for enhanced data verification

### Improved
- Enhanced configuration data validation mechanisms
- Better error handling for invalid configurations

## [1.0.7] - 2024-02-26

### Added
- JSON Schema support for configuration validation
- Enhanced configuration file parsing

### Fixed
- Improved configuration loading reliability
- Better error messages for configuration issues

## [1.0.6] - 2023-10-21

### Added
- Enhanced YAML configuration support
- Improved file loading mechanisms

### Fixed
- Configuration file reading edge cases
- Better handling of missing configuration files

## [1.0.5] - 2023-10-16

### Added
- Environment variable override support
- Enhanced configuration merging

### Improved
- Configuration loading performance
- Error handling and reporting

## [1.0.4] - 2023-10-16

### Added
- YAML configuration file support (.yml and .yaml)
- Enhanced configuration file discovery

### Fixed
- Configuration file path resolution issues
- Improved error messages

## [1.0.3] - 2023-10-14

### Added
- Immutable configuration support
- Configuration section isolation

### Improved
- Memory usage optimization
- Configuration access performance

## [1.0.2] - 2023-10-14

### Added
- Enhanced JSON configuration support
- Configuration file includes support

### Fixed
- Configuration merging edge cases
- File loading error handling

## [1.0.1] - 2023-10-13

### Added
- Environment-specific configuration loading
- NODE_ENV based configuration file selection

### Fixed
- Configuration loading race conditions
- Improved error messaging

## [1.0.0] - 2023-10-13

### Added
- Initial release of nest-simple-config
- JSON configuration file support
- Environment variable integration
- NestJS dependency injection support
- Basic configuration service
- Configuration module setup
- TypeScript support

### Features
- Simple configuration management for NestJS applications
- Support for JSON configuration files
- Environment variable overrides
- Type-safe configuration access
- Flexible configuration loading strategies

---

## Migration Guide

### From @mediaedge4tw/nest-simple-config to nest-simple-config (v2.0.0)

```bash
# Uninstall old package
npm uninstall @mediaedge4tw/nest-simple-config

# Install new package
npm install nest-simple-config
```

Update imports in your code:
```typescript
// Before
import { SimpleConfigModule } from '@mediaedge4tw/nest-simple-config';

// After
import { SimpleConfigModule } from 'nest-simple-config';
```

### Command Line Configuration (v2.1.0)

Command line arguments are now automatically supported with highest priority:

```bash
# Example usage
node dist/main.js --database.host=localhost --database.port=5432 --servers.0.name=web1
```

For more details, see the [README](./README.md) documentation.
