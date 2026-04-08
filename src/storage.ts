import * as vscode from "vscode";
import {
	emptyProjectData,
	emptyVaultData,
	type ProjectData,
	type VaultData,
} from "./types";

const STORAGE_KEY = "cmdvault.vault";
const GLOBAL_STORAGE_KEY = "cmdvault.globalVault";

export class VaultStorage {
	constructor(
		private readonly workspaceState: vscode.Memento,
		private readonly globalState: vscode.Memento,
	) {}

	load(): VaultData {
		const raw = this.workspaceState.get<VaultData | undefined>(STORAGE_KEY);
		if (!raw || raw.version !== 1 || typeof raw.projects !== "object") {
			return emptyVaultData();
		}
		return raw;
	}

	async save(data: VaultData): Promise<void> {
		await this.workspaceState.update(STORAGE_KEY, data);
	}

	getProject(folderUri: string): ProjectData {
		const vault = this.load();
		return vault.projects[folderUri] ?? emptyProjectData();
	}

	async setProject(folderUri: string, project: ProjectData): Promise<void> {
		const vault = this.load();
		vault.projects[folderUri] = project;
		await this.save(vault);
	}

	async updateProject(
		folderUri: string,
		fn: (p: ProjectData) => ProjectData,
	): Promise<ProjectData> {
		const current = this.getProject(folderUri);
		const next = fn(structuredClone(current));
		await this.setProject(folderUri, next);
		return next;
	}

	getGlobal(): ProjectData {
		const raw = this.globalState.get<
			{ version: 1; sections: ProjectData["sections"] } | undefined
		>(GLOBAL_STORAGE_KEY);
		if (!raw || raw.version !== 1 || !Array.isArray(raw.sections)) {
			return emptyProjectData();
		}
		return { sections: raw.sections };
	}

	async setGlobal(project: ProjectData): Promise<void> {
		await this.globalState.update(GLOBAL_STORAGE_KEY, {
			version: 1,
			sections: project.sections,
		});
	}

	async updateGlobal(
		fn: (p: ProjectData) => ProjectData,
	): Promise<ProjectData> {
		const current = this.getGlobal();
		const next = fn(structuredClone(current));
		await this.setGlobal(next);
		return next;
	}
}
