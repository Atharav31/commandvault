import * as vscode from "vscode";

/**
 * Picks a Codicon id from the command text. Product icon themes (e.g. Material Icon Theme)
 * can restyle these; we only choose which built-in icon id to use.
 */
export function themeIconForShellCommand(command: string): vscode.ThemeIcon {
	const c = command.trim().toLowerCase();
	if (!c) {
		return new vscode.ThemeIcon("terminal");
	}

	// Containers & images (vm = container-like; codicon "docker" may vary by VS Code version)
	if (/\b(docker|podman|docker-compose|compose|buildx)\b/.test(c)) {
		return new vscode.ThemeIcon("vm");
	}

	// Kubernetes & cloud CLIs
	if (/\b(kubectl|helm|kustomize|minikube|k9s|skaffold|kind)\b/.test(c)) {
		return new vscode.ThemeIcon("cloud");
	}
	if (/\b(aws|gcloud|az|azcopy|pulumi|terraform|tofu)\b/.test(c)) {
		return new vscode.ThemeIcon("cloud");
	}

	// Git & GitHub CLI
	if (/\bgit\b/.test(c)) {
		return new vscode.ThemeIcon("git-branch");
	}
	if (/^\s*gh\s/.test(c) || /\bgh\s+(auth|pr|repo|workflow)\b/.test(c)) {
		return new vscode.ThemeIcon("github");
	}

	// Node / JS runtimes & package managers
	if (/\b(npm|npx|yarn|pnpm|bun|node|corepack|deno)\b/.test(c)) {
		return new vscode.ThemeIcon("package");
	}

	// Python / REPL-style CLIs
	if (/\b(python|python3|pip|pip3|uv|poetry|pipenv|conda|mamba)\b/.test(c)) {
		return new vscode.ThemeIcon("repl");
	}

	// JVM / build tools
	if (/\b(mvn|gradle|java|javac|kotlin|kt)\b/.test(c)) {
		return new vscode.ThemeIcon("coffee");
	}

	// Go
	if (/\b(go|gofmt|golangci-lint)\b/.test(c)) {
		return new vscode.ThemeIcon("bracket");
	}

	// Rust
	if (/\b(cargo|rustc|rustup|rustfmt)\b/.test(c)) {
		return new vscode.ThemeIcon("bracket-dot");
	}

	// Ruby
	if (/\b(ruby|gem|bundle|rake|rails)\b/.test(c)) {
		return new vscode.ThemeIcon("ruby");
	}

	// C/C++ build
	if (/\b(gcc|g\+\+|clang|cmake|ninja|meson)\b/.test(c)) {
		return new vscode.ThemeIcon("tools");
	}

	// Make
	if (/\bmake\b/.test(c)) {
		return new vscode.ThemeIcon("tools");
	}

	// Network / fetch
	if (/\b(curl|wget|httpie|xh)\b/.test(c)) {
		return new vscode.ThemeIcon("globe");
	}

	// Remote
	if (/\bssh\b/.test(c) || /\bscp\b/.test(c) || /\brsync\b/.test(c)) {
		return new vscode.ThemeIcon("remote");
	}

	// Editors / IDE from CLI
	if (/\b(code|code-insiders|cursor)\b/.test(c)) {
		return new vscode.ThemeIcon("code");
	}

	// Shell scripts
	if (c.startsWith("./") || /\.(sh|bash|zsh)\b/.test(c) || /^\s*(bash|sh|zsh|fish)\s/.test(c)) {
		return new vscode.ThemeIcon("terminal-bash");
	}

	return new vscode.ThemeIcon("terminal");
}
