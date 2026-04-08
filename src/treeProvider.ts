import * as vscode from "vscode";
import { themeIconForShellCommand } from "./commandIcons";
import { sortCommands, sortSections } from "./sort";
import type { CommandEntry, Section } from "./types";
import { VaultStorage } from "./storage";

export type VaultTreeModel =
	| { kind: "globalRoot" }
	| { kind: "project"; folderUri: string; name: string }
	| { kind: "section"; scope: "global"; section: Section }
	| { kind: "section"; scope: "workspace"; folderUri: string; section: Section }
	| {
			kind: "command";
			scope: "global";
			section: Section;
			entry: CommandEntry;
	  }
	| {
			kind: "command";
			scope: "workspace";
			folderUri: string;
			section: Section;
			entry: CommandEntry;
	  };

function workspaceFolder(
	folderUri: string,
): vscode.WorkspaceFolder | undefined {
	return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folderUri));
}

export function isGlobalRoot(
	m: VaultTreeModel,
): m is Extract<VaultTreeModel, { kind: "globalRoot" }> {
	return m.kind === "globalRoot";
}

export function isProjectModel(
	m: VaultTreeModel,
): m is Extract<VaultTreeModel, { kind: "project" }> {
	return m.kind === "project";
}

export function isSectionNode(
	m: VaultTreeModel,
): m is Extract<VaultTreeModel, { kind: "section" }> {
	return m.kind === "section";
}

export function isCommandNode(
	m: VaultTreeModel,
): m is Extract<VaultTreeModel, { kind: "command" }> {
	return m.kind === "command";
}

function commandClickAction(
	element: Extract<VaultTreeModel, { kind: "command" }>,
): vscode.Command | undefined {
	const action = vscode.workspace
		.getConfiguration("cmdvault")
		.get<string>("commandClickAction", "none");
	if (action === "run") {
		return {
			command: "cmdvault.runInTerminal",
			title: "Run in Terminal",
			arguments: [element],
		};
	}
	if (action === "copy") {
		return {
			command: "cmdvault.copyCommand",
			title: "Copy Command",
			arguments: [element],
		};
	}
	return undefined;
}

export class CmdVaultTreeProvider
	implements vscode.TreeDataProvider<VaultTreeModel>
{
	private readonly _onDidChange = new vscode.EventEmitter<
		VaultTreeModel | undefined | null | void
	>();
	readonly onDidChangeTreeData = this._onDidChange.event;

	/** Substring filter (case-insensitive); empty shows everything. */
	private filterQuery = "";

	constructor(private readonly storage: VaultStorage) {}

	setFilter(query: string): void {
		this.filterQuery = query.trim();
		this._onDidChange.fire();
	}

	getFilter(): string {
		return this.filterQuery;
	}

	refresh(): void {
		this._onDidChange.fire();
	}

	private filterNorm(): string {
		return this.filterQuery.toLowerCase();
	}

	private sectionVisible(section: Section): boolean {
		const q = this.filterNorm();
		if (!q) {
			return true;
		}
		if (section.name.toLowerCase().includes(q)) {
			return true;
		}
		return section.commands.some(
			(c) =>
				c.label.toLowerCase().includes(q) ||
				c.command.toLowerCase().includes(q),
		);
	}

	private commandVisible(section: Section, entry: CommandEntry): boolean {
		const q = this.filterNorm();
		if (!q) {
			return true;
		}
		if (section.name.toLowerCase().includes(q)) {
			return true;
		}
		return (
			entry.label.toLowerCase().includes(q) ||
			entry.command.toLowerCase().includes(q)
		);
	}

	getTreeItem(element: VaultTreeModel): vscode.TreeItem {
		switch (element.kind) {
			case "globalRoot": {
				const item = new vscode.TreeItem(
					"Global (shared)",
					vscode.TreeItemCollapsibleState.Expanded,
				);
				item.id = "global:root";
				item.contextValue = "globalRoot";
				item.iconPath = new vscode.ThemeIcon("globe");
				item.description = "git, docker, …";
				return item;
			}
			case "project": {
				const uri = vscode.Uri.parse(element.folderUri);
				const item = new vscode.TreeItem(
					element.name,
					vscode.TreeItemCollapsibleState.Expanded,
				);
				item.id = `project:${element.folderUri}`;
				item.contextValue = "project";
				item.iconPath = new vscode.ThemeIcon("folder");
				item.description = vscode.workspace.asRelativePath(uri);
				return item;
			}
			case "section": {
				const item = new vscode.TreeItem(
					element.section.name,
					vscode.TreeItemCollapsibleState.Expanded,
				);
				if (element.scope === "global") {
					item.id = `section:global:${element.section.id}`;
					item.contextValue = "globalSection";
				} else {
					item.id = `section:${element.folderUri}:${element.section.id}`;
					item.contextValue = "section";
				}
				item.iconPath = new vscode.ThemeIcon("symbol-namespace");
				return item;
			}
			case "command": {
				const item = new vscode.TreeItem(
					element.entry.label,
					vscode.TreeItemCollapsibleState.None,
				);
				if (element.scope === "global") {
					item.id = `command:global:${element.section.id}:${element.entry.id}`;
					item.contextValue = "globalCommand";
				} else {
					item.id = `command:${element.folderUri}:${element.section.id}:${element.entry.id}`;
					item.contextValue = "command";
				}
				const useToolIcons = vscode.workspace
					.getConfiguration("cmdvault")
					.get<boolean>("useToolIcons", true);
				item.iconPath = useToolIcons
					? themeIconForShellCommand(element.entry.command)
					: new vscode.ThemeIcon("terminal");
				item.tooltip = new vscode.MarkdownString(
					`\`\`\`shell\n${element.entry.command}\n\`\`\``,
				);
				item.command = commandClickAction(element);
				return item;
			}
		}
	}

	getChildren(
		element?: VaultTreeModel,
	): vscode.ProviderResult<VaultTreeModel[]> {
		if (!element) {
			const roots: VaultTreeModel[] = [{ kind: "globalRoot" }];
			const folders = [...(vscode.workspace.workspaceFolders ?? [])].sort(
				(a, b) =>
					a.name.localeCompare(b.name, undefined, {
						sensitivity: "base",
					}),
			);
			for (const folder of folders) {
				roots.push({
					kind: "project",
					folderUri: folder.uri.toString(),
					name: folder.name,
				});
			}
			return roots;
		}

		if (element.kind === "globalRoot") {
			return sortSections(this.storage.getGlobal().sections)
				.filter((section) => this.sectionVisible(section))
				.map((section) => ({
					kind: "section" as const,
					scope: "global" as const,
					section,
				}));
		}

		if (element.kind === "project") {
			return sortSections(this.storage.getProject(element.folderUri).sections)
				.filter((section) => this.sectionVisible(section))
				.map((section) => ({
					kind: "section" as const,
					scope: "workspace" as const,
					folderUri: element.folderUri,
					section,
				}));
		}

		if (element.kind === "section") {
			const cmds = sortCommands(element.section.commands).filter((entry) =>
				this.commandVisible(element.section, entry),
			);
			if (element.scope === "global") {
				return cmds.map((entry) => ({
					kind: "command" as const,
					scope: "global" as const,
					section: element.section,
					entry,
				}));
			}
			return cmds.map((entry) => ({
				kind: "command" as const,
				scope: "workspace" as const,
				folderUri: element.folderUri,
				section: element.section,
				entry,
			}));
		}

		return [];
	}

	getParent(
		element: VaultTreeModel,
	): vscode.ProviderResult<VaultTreeModel> {
		if (element.kind === "globalRoot" || element.kind === "project") {
			return undefined;
		}
		if (element.kind === "section") {
			if (element.scope === "global") {
				return { kind: "globalRoot" };
			}
			const folder = workspaceFolder(element.folderUri);
			return {
				kind: "project",
				folderUri: element.folderUri,
				name: folder?.name ?? vscode.Uri.parse(element.folderUri).fsPath,
			};
		}
		if (element.scope === "global") {
			return {
				kind: "section",
				scope: "global",
				section: element.section,
			};
		}
		return {
			kind: "section",
			scope: "workspace",
			folderUri: element.folderUri,
			section: element.section,
		};
	}
}

export { workspaceFolder };
