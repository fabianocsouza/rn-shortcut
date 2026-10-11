# Change Log

All notable changes to the "rn-shortcut" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.3.1] - 2026-10-11

### Changed

- README: clearer "AI asks the extension for the templates" section, with a setup table per editor and the details in a collapsible block.

## [1.3.0] - 2026-10-11

### Changed

- `rn-ctx`: the setter (`setValue`) is now its own field with a correct default, so leaving the snippet early no longer produces `setvalue`. Fields: name → value → type → setter → initial value.

### Added

- **AI rules:** `ai-rules/` has the snippet templates as instruction files for Cursor, GitHub Copilot, Claude Code and `AGENTS.md`, so AI-generated code follows the same patterns.
- **Command "React Native Snippets: Add AI rules to project":** writes those files into the open project; existing files keep their content and re-running updates the section in place.
- After adding the rules, choose **Share with project** (commit them) or **Keep on this machine only**: newly created files are hidden via `.git/info/exclude` (local, never committed); files that already existed are never hidden.
- **AI tools** `list_snippets` and `get_snippet`: built into Copilot in VS Code (enabled by default, no setup, also usable as `#rnSnippet`); their descriptions and the AI rules tell the assistant to fetch the template before writing React Native code, and available to Cursor, Claude Code and other clients through an MCP server (`npx -y github:fabianocsouza/rn-shortcut`).
- **Discoverable without the README:** opening a React Native/Expo project without the rules shows a one-time *Add AI rules* prompt, and a **Get Started** walkthrough (also via *React Native Snippets: Get Started*) explains snippets, AI rules and Copilot.
- **New Get Started walkthrough** in 6 steps with illustrations for dark and light themes. It opens once after install and has buttons to try the snippets (*Try the snippets* opens a playground file), add AI rules, open Copilot Chat, copy the MCP setup for Cursor / Claude Code, and rate the extension.
- Walkthrough, commands and prompts in **English and Brazilian Portuguese**.
- README: "New in 1.3" highlight with a demo GIF of the AI flow (Add AI rules → Copilot calls `get_snippet` → generated file → Get Started).
- New README banner; the extension is called **React Native Snippets** everywhere (the ID `fabianocs.rn-shortcut` is unchanged).
- Unit tests (`npm test`) run in CI.

## [1.2.5] - 2026-10-06

### Fixed

- Snippets now only appear in JavaScript, JSX, TypeScript and TSX files instead of every language.

### Added

- Release workflow: merging a version bump to `main` publishes to the VS Code Marketplace and Open VSX and creates a GitHub release.

## [1.2.4] - 2026-10-03

### Fixed

- README: replaced retired shields.io Marketplace badges; added Open VSX downloads badge.

## [1.2.3] - 2026-10-03

### Changed

- README: macOS-style GIFs with React Native Shortcut branding.

## [1.2.2] - 2026-10-03

### Changed

- README: new demo GIF for `rn-ctx`/`rn-fl` and redone GIFs for component and hook snippets.

## [1.2.1] - 2026-10-03

### Changed

- Marketplace listing: new display name, description, keywords, gallery banner and README badges.
- Icon resized to 256×256 (1.45 MB → 33 KB).
- Added `npm run publish:ovsx` for Open VSX (Cursor, Windsurf, VSCodium).

## [1.2.0] - 2026-10-03

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
