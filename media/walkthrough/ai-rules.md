# Make AI follow the same templates

Copilot, Cursor, Claude Code and other assistants don't press Tab, but they read instruction files in your project.

**Add AI rules** writes those files with the snippet templates:

- `AGENTS.md`: Codex, Claude Code, Cursor, Copilot agent and others
- `.cursor/rules/react-native-snippets.mdc`: Cursor
- `.github/copilot-instructions.md`: GitHub Copilot
- `CLAUDE.md`: Claude Code (optional)

If a file already exists, your content is kept: the templates go in their own section at the end, and running it again just updates that section.
