import type { CommandEntry, ProjectData, Section } from "./types";

export function sortSections(sections: Section[]): Section[] {
	return [...sections].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
	);
}

export function sortCommands(commands: CommandEntry[]): CommandEntry[] {
	return [...commands].sort((a, b) =>
		a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
	);
}

/** Keep sections and commands in alphabetical order in stored data. */
export function normalizeProjectData(p: ProjectData): ProjectData {
	return {
		sections: sortSections(p.sections).map((s) => ({
			...s,
			commands: sortCommands(s.commands),
		})),
	};
}
