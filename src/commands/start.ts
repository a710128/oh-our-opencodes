import type { OpenCodeCommandDefinition } from './types';

export const startCommand: OpenCodeCommandDefinition = {
  // TODO: Replace this template with your own content.
  template: `Please analyze this codebase and create an AGENTS.md file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 150 lines long.
If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.

If there's already an AGENTS.md, improve it if it's located in !\`pwd\`

Also, use the "agents-markdown" skill to write or update the AGENTS.md file if the skill is available.`,
  description: 'Analyze codebase and create/update AGENTS.md',
};
