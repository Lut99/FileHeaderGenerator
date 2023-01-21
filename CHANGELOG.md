# Change Log


## [1.3.0] - 2023-01-21
### Added
- Support for WGSL and [eFLINT](https://gitlab.com/eflint).
- A section on the definition of custom languages in the `README.md` file.
- The possibility to define your own languages using the new `file-header-generator.customLanguages` property.

### Changed
- The `file-header-generator.rustDocString` property to `file-header-generator.docString`.
- The order of the CHANGELOG.md file
- The dates in the CHANGELOG.md file

### Fixed
- Security vulnerability by bumping luxon to 2.5.2.


## [1.2.0] - 2022-07-30
### Added
 - New `file-header-generator.rustDocString` property that determines if Rust comments will implement the new docstring-aware description.

### Changed
 - Rust to now be docstring-aware, using `//!` for the description to propagate it to Rust's auto-generated docs. This behaviour can be controlled with the `file-header-generator.rustDocString` setting.
 - Rust last-edited updates to overwrite comments with the current comment style (based on the `file-header-generator.rustDocString` property).
 - The internal codebase to now use a Header struct, which makes it much more clear what we're parsing and how.


## [1.1.0] - 2021-12-21

### Added
 - Rust support

### Changed
 - The FileHeaderGenerator can now use custom dateformats, which can be edited by the 'dateFormat' option.
 - Changed the default number of lines to search from 20 to 15.
 - The extension now starts up after Visual Studio Code does, increasing startup performance.

### Fixed
 - The automatic update not working on Windows due to carriage returns (`\r`).


## [1.0.7] - 2021-05-01

### Added
 - Shellscript support
 - Makefile support
 - CMake support
 - GLSL support

### Fixed
 - A few vulnerabilities in dependencies, by upgrading to newer dependencies.


## [1.0.6] - 2020-03-16

### Added
- HTML support
- CSS support
- PHP support

### Changed
- Altered placeholder for file description to be a little more accurate


## [1.0.5] - 2020-01-23

### Added
- Updated the changelog and README to include version 1.0.4 and 1.0.5.


## [1.0.4] - 2020-01-23

### Added
- CUDA (.cu) support


## [1.0.3] - 2020-01-15

### Added
- The changelog file is now maintained


## [1.0.2] - 2020-01-15

### Added
- Now displays notification when command `Generate Header` is run but the extension isn't enabled

### Fixed
- Extension is now enabling itself according to the config, not always setting itself to disabled


## [1.0.1] - 2020-01-15

### Added
- TypeScript support
- JavaScript support


## [1.0.0] - 2020-01-15
Initial release.
