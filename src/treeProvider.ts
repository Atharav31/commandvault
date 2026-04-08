import * as vscode from "vscode";
import { themeIconForShellCommand } from "./commandIcons";
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
		.getConfiguration("commandvault")
		.get<string>("commandClickAction", "none");
	if (action === "run") {
		return {
			command: "commandvault.runInTerminal",
			title: "Run in Terminal",
			arguments: [element],
		};
	}
	if (action === "copy") {
		return {
			command: "commandvault.copyCommand",
			title: "Copy Command",
			arguments: [element],
		};
	}
	return undefined;
}

export class CommandVaultTreeProvider
	implements vscode.TreeDataProvider<VaultTreeModel>
{
	private readonly _onDidChange = new vscode.EventEmitter<
		VaultTreeModel | undefined | null | void
	>();
	readonly onDidChangeTreeData = this._onDidChange.event;

	constructor(private readonly storage: VaultStorage) {}

	refresh(): void {
		this._onDidChange.fire();
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
					.getConfiguration("commandvault")
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
			for (const folder of vscode.workspace.workspaceFolders ?? []) {
				roots.push({
					kind: "project",
					folderUri: folder.uri.toString(),
					name: folder.name,
				});
			}
			return roots;
		}

		if (element.kind === "globalRoot") {
			return this.storage.getGlobal().sections.map((section) => ({
				kind: "section" as const,
				scope: "global" as const,
				section,
			}));
		}

		if (element.kind === "project") {
			const data = this.storage.getProject(element.folderUri);
			return data.sections.map((section) => ({
				kind: "section" as const,
				scope: "workspace" as const,
				folderUri: element.folderUri,
				section,
			}));
		}

		if (element.kind === "section") {
			if (element.scope === "global") {
				return element.section.commands.map((entry) => ({
					kind: "command" as const,
					scope: "global" as const,
					section: element.section,
					entry,
				}));
			}
			return element.section.commands.map((entry) => ({
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
