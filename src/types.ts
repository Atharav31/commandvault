export interface CommandEntry {
	id: string;
	label: string;
	command: string;
}

export interface Section {
	id: string;
	name: string;
	commands: CommandEntry[];
}

export interface ProjectData {
	sections: Section[];
}

export interface VaultData {
	version: 1;
	projects: Record<string, ProjectData>;
}

export function emptyProjectData(): ProjectData {
	return { sections: [] };
}

export function emptyVaultData(): VaultData {
	return { version: 1, projects: {} };
}
