# Change Log

All notable changes to the "rn-shortcut" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.2.0] - 2026-10-03

### Changed

- New display name, description and keywords for better Marketplace search.
- Gallery banner, README badges and Open VSX publishing (`npm run publish:ovsx`).

### Added

- `rn-props`: component with typed `Props`.
- `rn-fl`: `FlatList` with `keyExtractor` and `renderItem`.
- `rn-ctx`: Context with Provider and custom hook.

### Removed

- Unused `assets/head.png` (2.6 MB smaller package).

## [1.1.0] - 2026-10-03

### Changed

- `ust`, `od` and `cl` snippets now end with a semicolon and use consistent spacing.
- `uef` snippet now has tab stops for the effect body and the dependency array.
- Snippets are registered explicitly for JavaScript, JSX, TypeScript and TSX.
- Updated `@vscode/vsce` to v4 and added `package`/`publish` scripts.
- README: supported file types and local development instructions.
- Added a CI workflow that packages the extension on every pull request.

### Fixed

- Indentation of `container` inside the `rn-s` StyleSheet.

## [1.0.0]

- Initial release.
