import * as crypto from "node:crypto";
import * as vscode from "vscode";
import { VaultStorage } from "./storage";
import type { CommandEntry, Section } from "./types";
import {
	CmdVaultTreeProvider,
	isCommandNode,
	isGlobalRoot,
	isProjectModel,
	isSectionNode,
	workspaceFolder,
	type VaultTreeModel,
} from "./treeProvider";

async function promptName(
	title: string,
	placeholder: string,
	value?: string,
): Promise<string | undefined> {
	const name = await vscode.window.showInputBox({
		title,
		prompt: placeholder,
		value,
		validateInput: (v) =>
			v.trim().length === 0 ? "Name is required." : undefined,
	});
	return name?.trim();
}

function terminalCwdForGlobalCommand(): string | undefined {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function activate(context: vscode.ExtensionContext) {
	const storage = new VaultStorage(
		context.workspaceState,
		context.globalState,
	);
	const treeProvider = new CmdVaultTreeProvider(storage);

	const treeView = vscode.window.createTreeView("cmdvault.commandsView", {
		treeDataProvider: treeProvider,
		showCollapseAll: true,
	});

	const updateViewMessage = () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			treeView.message =
				"No folder opened—**Global (shared)** still works for common commands. Open a folder for per-project commands.";
		} else {
			treeView.message = undefined;
		}
	};

	const refresh = () => {
		updateViewMessage();
		treeProvider.refresh();
	};

	updateViewMessage();
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			refresh();
		}),
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (
				e.affectsConfiguration("cmdvault.commandClickAction") ||
				e.affectsConfiguration("cmdvault.useToolIcons")
			) {
				refresh();
			}
		}),
	);

	const runInTerminal = async (model?: VaultTreeModel) => {
		if (!model || !isCommandNode(model)) {
			return;
		}
		let cwd: string | undefined;
		if (model.scope === "workspace") {
			const folder = workspaceFolder(model.folderUri);
			if (!folder) {
				vscode.window.showErrorMessage(
					"That project folder is no longer in the workspace.",
				);
				return;
			}
			cwd = folder.uri.fsPath;
		} else {
			cwd = terminalCwdForGlobalCommand();
		}
		const terminal = vscode.window.createTerminal({
			...(cwd ? { cwd } : {}),
			name: "CmdVault",
		});
		terminal.show();
		terminal.sendText(model.entry.command, true);
	};

	const copyCommand = async (model?: VaultTreeModel) => {
		if (!model || !isCommandNode(model)) {
			return;
		}
		await vscode.env.clipboard.writeText(model.entry.command);
		vscode.window.showInformationMessage("Command copied to clipboard.");
	};

	const addSection = async (model?: VaultTreeModel) => {
		let targetGlobal = false;
		let folderUri: string | undefined;
		let folder: vscode.WorkspaceFolder | undefined;

		if (model && isGlobalRoot(model)) {
			targetGlobal = true;
		} else if (model && isProjectModel(model)) {
			folderUri = model.folderUri;
			folder = workspaceFolder(folderUri);
			if (!folder) {
				return;
			}
		} else {
			type PickEntry = vscode.QuickPickItem & {
				_global?: boolean;
				_folder?: vscode.WorkspaceFolder;
			};
			const items: PickEntry[] = [
				{
					label: "$(globe) Global (shared)",
					description: "Available in every workspace",
					_global: true,
				},
			];
			for (const f of vscode.workspace.workspaceFolders ?? []) {
				items.push({
					label: `$(folder) ${f.name}`,
					description: f.uri.fsPath,
					_folder: f,
				});
			}
			if (items.length === 1) {
				targetGlobal = true;
			} else {
				const picked = await vscode.window.showQuickPick(items, {
					title: "Add section to…",
					placeHolder: "Global or a project folder",
				});
				if (!picked) {
					return;
				}
				if (picked._global) {
					targetGlobal = true;
				} else if (picked._folder) {
					folder = picked._folder;
					folderUri = folder.uri.toString();
				}
			}
		}

		if (!targetGlobal && (!folderUri || !folder)) {
			return;
		}

		const name = await promptName("New section", "Section name");
		if (!name) {
			return;
		}
		const section: Section = {
			id: crypto.randomUUID(),
			name,
			commands: [],
		};

		if (targetGlobal) {
			await storage.updateGlobal((p) => ({
				...p,
				sections: [...p.sections, section],
			}));
		} else if (folderUri) {
			await storage.updateProject(folderUri, (p) => ({
				...p,
				sections: [...p.sections, section],
			}));
		}
		refresh();
	};

	const addCommand = async (model?: VaultTreeModel) => {
		if (!model || !isSectionNode(model)) {
			return;
		}
		const commandText = await vscode.window.showInputBox({
			title: "New command",
			prompt: "Shell command to store",
			placeHolder: "e.g. docker compose up -d",
			validateInput: (v) =>
				v.trim().length === 0 ? "Command is required." : undefined,
		});
		if (!commandText?.trim()) {
			return;
		}
		const trimmed = commandText.trim();
		const label =
			(await promptName(
				"Label",
				"Short label for the tree",
				trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed,
			)) ?? trimmed;

		const entry: CommandEntry = {
			id: crypto.randomUUID(),
			label,
			command: trimmed,
		};
		const sectionId = model.section.id;

		if (model.scope === "global") {
			await storage.updateGlobal((p) => ({
				...p,
				sections: p.sections.map((s) =>
					s.id === sectionId
						? { ...s, commands: [...s.commands, entry] }
						: s,
				),
			}));
		} else {
			await storage.updateProject(model.folderUri, (p) => ({
				...p,
				sections: p.sections.map((s) =>
					s.id === sectionId
						? { ...s, commands: [...s.commands, entry] }
						: s,
				),
			}));
		}
		refresh();
	};

	const editCommand = async (model?: VaultTreeModel) => {
		if (!model || !isCommandNode(model)) {
			return;
		}
		const sectionId = model.section.id;
		const commandId = model.entry.id;

		const label = await promptName("Edit label", "Label", model.entry.label);
		if (!label) {
			return;
		}
		const commandText = await vscode.window.showInputBox({
			title: "Edit command",
			prompt: "Shell command",
			value: model.entry.command,
			validateInput: (v) =>
				v.trim().length === 0 ? "Command is required." : undefined,
		});
		if (!commandText?.trim()) {
			return;
		}

		const apply = (sections: Section[]) =>
			sections.map((s) =>
				s.id !== sectionId
					? s
					: {
							...s,
							commands: s.commands.map((c) =>
								c.id === commandId
									? { ...c, label, command: commandText.trim() }
									: c,
							),
						},
			);

		if (model.scope === "global") {
			await storage.updateGlobal((p) => ({
				...p,
				sections: apply(p.sections),
			}));
		} else {
			await storage.updateProject(model.folderUri, (p) => ({
				...p,
				sections: apply(p.sections),
			}));
		}
		refresh();
	};

	const renameSection = async (model?: VaultTreeModel) => {
		if (!model || !isSectionNode(model)) {
			return;
		}
		const name = await promptName(
			"Rename section",
			"Section name",
			model.section.name,
		);
		if (!name) {
			return;
		}
		const sectionId = model.section.id;

		if (model.scope === "global") {
			await storage.updateGlobal((p) => ({
				...p,
				sections: p.sections.map((s) =>
					s.id === sectionId ? { ...s, name } : s,
				),
			}));
		} else {
			await storage.updateProject(model.folderUri, (p) => ({
				...p,
				sections: p.sections.map((s) =>
					s.id === sectionId ? { ...s, name } : s,
				),
			}));
		}
		refresh();
	};

	const deleteItem = async (model?: VaultTreeModel) => {
		if (!model) {
			return;
		}

		if (isCommandNode(model)) {
			const pick = await vscode.window.showWarningMessage(
				`Delete command "${model.entry.label}"?`,
				{ modal: true },
				"Delete",
			);
			if (pick !== "Delete") {
				return;
			}
			const sectionId = model.section.id;
			const commandId = model.entry.id;
			const stripCommand = (sections: Section[]) =>
				sections.map((s) =>
					s.id !== sectionId
						? s
						: {
								...s,
								commands: s.commands.filter((c) => c.id !== commandId),
							},
				);
			if (model.scope === "global") {
				await storage.updateGlobal((p) => ({
					...p,
					sections: stripCommand(p.sections),
				}));
			} else {
				await storage.updateProject(model.folderUri, (p) => ({
					...p,
					sections: stripCommand(p.sections),
				}));
			}
			refresh();
			return;
		}

		if (isSectionNode(model)) {
			const pick = await vscode.window.showWarningMessage(
				`Delete section "${model.section.name}" and all of its commands?`,
				{ modal: true },
				"Delete",
			);
			if (pick !== "Delete") {
				return;
			}
			const sectionId = model.section.id;
			if (model.scope === "global") {
				await storage.updateGlobal((p) => ({
					...p,
					sections: p.sections.filter((s) => s.id !== sectionId),
				}));
			} else {
				await storage.updateProject(model.folderUri, (p) => ({
					...p,
					sections: p.sections.filter((s) => s.id !== sectionId),
				}));
			}
			refresh();
		}
	};

	context.subscriptions.push(
		treeView,
		vscode.commands.registerCommand("cmdvault.refresh", refresh),
		vscode.commands.registerCommand("cmdvault.runInTerminal", runInTerminal),
		vscode.commands.registerCommand("cmdvault.copyCommand", copyCommand),
		vscode.commands.registerCommand("cmdvault.addSection", addSection),
		vscode.commands.registerCommand("cmdvault.addCommand", addCommand),
		vscode.commands.registerCommand("cmdvault.editCommand", editCommand),
		vscode.commands.registerCommand("cmdvault.renameSection", renameSection),
		vscode.commands.registerCommand("cmdvault.deleteItem", deleteItem),
	);
}

export function deactivate() {}
