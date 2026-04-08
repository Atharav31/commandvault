# Changelog

All notable changes to **CmdVault** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.2] - 2026-04-08

### Added

- **Search / Filter** in the Commands view title bar: filter sections and commands by substring (section name, command label, or stored command text). **Clear Filter** appears while a filter is active. The active filter is shown as the view subtitle.
- Alphabetical order: **workspace folders** (multi-root), **sections** (by name), and **commands** (by label), both in the tree and in persisted storage.

## [0.1.1] - 2026-04-08

### Changed

- **Extension name** (Marketplace identifier) from `commandvault` to **`cmdvault`** so it can be published on the VS Code Marketplace (the previous id was taken).
- **Display name** and branding: **CmdVault**.
- Settings keys: `cmdvault.commandClickAction`, `cmdvault.useToolIcons`.
- Storage keys: `cmdvault.vault`, `cmdvault.globalVault` (existing `commandvault.*` data is not migrated).

## [0.1.0] - 2026-04-08

### Added

- Activity bar sidebar **Commands** tree with per-workspace-folder sections and **Global (shared)** commands.
- **Add Section** / **Add Command**, inline **+** on sections, **run** / **copy** on commands, context menus.
- **Run in Terminal** and **Copy Command**; storage in workspace state (per folder) and global state (shared).
- Settings: `commandvault.commandClickAction` (`none` | `run` | `copy`), `commandvault.useToolIcons`.
- Heuristic **tool icons** (Codicons) from command text.
- Documentation and MIT license for marketplace packaging.

[0.1.2]: https://github.com/Atharav31/commandvault/releases/tag/v0.1.2
[0.1.1]: https://github.com/Atharav31/commandvault/releases/tag/v0.1.1
[0.1.0]: https://github.com/Atharav31/commandvault/releases/tag/v0.1.0
