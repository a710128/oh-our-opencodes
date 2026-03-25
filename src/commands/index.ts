import { commitCommand } from './commit';
import { mergeCommand } from './merge';
import { startCommand } from './start';
import type { OpenCodeCommandMap } from './types';

/**
 * Commands injected into OpenCode config at plugin startup.
 *
 * Each command lives in its own file under `src/commands/`.
 * This map is merged into `opencodeConfig.command` in `src/index.ts`.
 */
export const injectedCommands: OpenCodeCommandMap = {
  commit: commitCommand,
  merge: mergeCommand,
  start: startCommand,
};
