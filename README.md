# CmdVault — save & run CLI commands in VS Code

**CmdVault** is a **Visual Studio Code extension** that acts as a **command manager** and **terminal helper**: keep **reusable shell commands**, **CLI snippets**, and **devops one-liners** in a **sidebar tree**—organized by **workspace project**, **sections**, and a **Global (shared)** library—then **run in terminal** or **copy to clipboard** in one click.

**Author:** [Atharav Uttekar](https://github.com/Atharav31) · Marketplace extension ID: **`atharav-dev.cmdvault`**

---

## Why CmdVault? (command palette alternative)

If you juggle **git**, **Docker**, **npm / yarn / pnpm**, **Kubernetes**, **Terraform**, or custom **bash / zsh / PowerShell** scripts, CmdVault gives you a **persistent command library** next to your files—not buried in history. It complements the **Command Palette** and **integrated terminal** for **productivity** and **team workflows** (global vs per-folder commands).

**Typical searches this extension matches:** *save terminal commands*, *run shell command from sidebar*, *CLI snippet manager*, *docker git npm commands vscode*, *workspace command list*, *multi-root workspace commands*, *copy paste terminal command*, *command vault vscode*.

---

## Features

- **Sidebar tree** in the **activity bar** (like Explorer / Source Control): expand/collapse, **inline** run/copy/**add**, context menus.
- **Per-project commands**: each **workspace folder** (including **multi-root** workspaces) has its own sections—ideal for **repo-specific** scripts.
- **Global (shared) commands**: **machine-wide** storage for **common CLI** patterns (e.g. **git**, **docker compose**, **kubectl**, **npm run**) available in **every** project.
- **Run in terminal** or **copy**; optional **tool-style icons** (Codicons) inferred from command text.
- **Configurable click**: select-only, **run on click**, or **copy on click** (`cmdvault.commandClickAction`).
- **Search / Filter**: title bar **search** icon to filter by section name, command label, or command text; **Clear filter** when active. Sections and commands stay **sorted A→Z** (folders, section names, command labels).

---

## Getting started

1. Install **CmdVault** from the [VS Code Marketplace](https://marketplace.visualstudio.com/vscode) (search **CmdVault**, **cmdvault**, or **Atharav Uttekar**).
2. Open the **CmdVault** icon in the **Activity Bar**.
3. Use **Search / Filter** in the view title if you want to narrow the list (optional).
4. Under **Global (shared)** or a **project folder**, use **Add Section**, then **Add Command** (toolbar **`+`**, inline, or right-click).
5. Use **play** / **copy** on each row, or the context menu.

If no folder is open, **Global (shared)** still works; open a folder for **per-project** lists.

---

## Commands

| Command | Description |
|--------|-------------|
| **Refresh** | Reload the tree from storage. |
| **Search / Filter** | Filter sections/commands (name or text); empty input clears. |
| **Clear Filter** | Remove the active filter (shown when a filter is set). |
| **Add Section** | New section under Global or a project. |
| **Add Command** | Store a **shell** / **CLI** command under a section. |
| **Run in Terminal** | Execute the command (workspace: that folder as `cwd`; global: first folder if any). |
| **Copy Command** | Copy command text to the **clipboard**. |
| **Edit Command** / **Rename Section** | Update labels or text. |
| **Delete** | Remove a command or section. |

---

## Extension settings

Search settings for **CmdVault**:

| Setting | Default | Description |
|--------|---------|-------------|
| `cmdvault.commandClickAction` | `none` | Click behavior: `none`, `run`, or `copy`. |
| `cmdvault.useToolIcons` | `true` | Infer **icons** from command text (git, npm, docker-style). |

---

## Data & privacy

- **Workspace folders**: stored in **workspace state** (this VS Code workspace).
- **Global (shared)**: stored in **global state** on this machine.

Nothing is sent to the network by CmdVault; commands stay **local** unless you share them yourself.

---

## Requirements

- **VS Code** `^1.110.0` (see `engines` in `package.json`).

---

## License

MIT — see [LICENSE](LICENSE).

---

## Links

- **Repository**: [github.com/Atharav31/commandvault](https://github.com/Atharav31/commandvault)
- **Issues**: [github.com/Atharav31/commandvault/issues](https://github.com/Atharav31/commandvault/issues)
- **Author**: **Atharav Uttekar** — extension **CmdVault** (`cmdvault`)
