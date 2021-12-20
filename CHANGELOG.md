# Change Log

## [Unreleased]

## [1.0.0] - 15-01-2020

- Initial release

## [1.0.1] - 15-01-2020

### Added
- TypeScript support
- JavaScript support

## [1.0.2] - 15-01-2020

### Added
- Now displays notification when command `Generate Header` is run but the extension isn't enabled

### Fixed
- Extension is now enabling itself according to the config, not always setting itself to disabled

## [1.0.3] - 15-01-2020

### Added
- The changelog file is now maintained

## [1.0.4] - 23-01-2020

### Added
- CUDA (.cu) support

## [1.0.5] - 23-01-2020

### Added
- Updated the changelog and README to include version 1.0.4 and 1.0.5.

## [1.0.6] - 16-03-2020

### Added
- HTML support
- CSS support
- PHP support

### Changed
- Altered placeholder for file description to be a little more accurate

## [1.0.7] - 01-05-2021

### Added
 - Shellscript support
 - Makefile support
 - CMake support
 - GLSL support

### Fixed
 - A few vulnerabilities in dependencies, by upgrading to newer dependencies.

## [1.1.0] - 21-12-2021

### Added
 - Rust support

### Changed
 - The FileHeaderGenerator can now use custom dateformats, which can be edited by the 'dateFormat' option.
 - Changed the default number of lines to search from 20 to 15.

### Fixed
 - The automatic update not working on Windows due to carriage returns (`\r`).
