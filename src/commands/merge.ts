import type { OpenCodeCommandDefinition } from './types';

export const mergeCommand: OpenCodeCommandDefinition = {
  description: 'Merge worktree changes back to the default branch',
  template: `Help me merge changes from a git worktree back into the default branch.

Keep the process concise and safe.

Process:
1. Inspect the current repository, branch, and git worktree state
2. Identify the source worktree branch and the correct target branch or target worktree
3. If the source branch, target branch, target worktree, or merge strategy is unclear, ask me before proceeding
4. When everything is clear, operate in the correct worktree context and perform the merge safely
5. If there are conflicts, stop and explain them clearly before continuing
6. Summarize the result and any next steps

Important notes:
- Do not guess the source or target branch
- Do not assume the default branch is named main
- Do not use destructive git commands unless I explicitly ask
- Check for uncommitted changes before merging
- Prefer the safest workflow and clearly explain risky situations`,
};
