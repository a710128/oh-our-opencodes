/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { parseArgs } from './index';
import { install } from './install';

describe('cli index', () => {
  test('parseArgs captures manual-only flags', () => {
    const args = parseArgs([
      '--no-tui',
      '--model=openai/gpt-5.3-codex',
      '--tmux=no',
      '--skills=yes',
      '--dry-run',
      '--models-only',
    ]);

    expect(args).toEqual({
      tui: false,
      model: 'openai/gpt-5.3-codex',
      tmux: 'no',
      skills: 'yes',
      dryRun: true,
      modelsOnly: true,
      unknownArgs: [],
    });
  });

  test('parseArgs leaves removed legacy flags in unknownArgs', () => {
    const args = parseArgs(['--openai=yes', '--antigravity=yes']);

    expect(args.unknownArgs).toEqual(['--openai=yes', '--antigravity=yes']);
  });

  test('install rejects non-interactive mode without model', async () => {
    const exitCode = await install({
      tui: false,
      unknownArgs: [],
    });

    expect(exitCode).toBe(1);
  });

  test('install rejects unsupported legacy flags in interactive mode', async () => {
    const exitCode = await install({
      tui: true,
      unknownArgs: ['--openai=yes'],
    });

    expect(exitCode).toBe(1);
  });
});
