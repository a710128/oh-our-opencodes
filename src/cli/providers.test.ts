/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { generateLiteConfig } from './providers';
import type { InstallConfig } from './types';

const manualAgentConfigs = {
  orchestrator: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
  designer: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
  explorer: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
  librarian: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
  fixer: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
  reviewer: {
    primary: 'openai/gpt-5.3-codex',
    fallback1: 'opencode/big-pickle',
    fallback2: 'opencode/big-pickle',
    fallback3: 'opencode/big-pickle',
  },
} as const;

const baseInstallConfig: InstallConfig = {
  hasTmux: false,
  installSkills: false,
  installCustomSkills: false,
  setupMode: 'manual',
  manualAgentConfigs: { ...manualAgentConfigs },
};

describe('providers', () => {
  test('generateLiteConfig always emits manual preset', () => {
    const config = generateLiteConfig(baseInstallConfig);

    expect(config.preset).toBe('manual');
    expect((config.presets as any).manual).toBeDefined();
  });

  test('generateLiteConfig uses manual agent configs', () => {
    const config = generateLiteConfig(baseInstallConfig);
    const agents = (config.presets as any).manual;

    expect(agents.orchestrator.model).toBe('openai/gpt-5.3-codex');
    expect(agents.orchestrator.skills).toEqual(['*']);
    expect(agents.designer.skills).toContain('agent-browser');
    expect(agents.fixer.skills).toContain('agents-markdown');
    expect(agents.reviewer.model).toBe('openai/gpt-5.3-codex');
  });

  test('generateLiteConfig emits fallback chains from manual config', () => {
    const config = generateLiteConfig(baseInstallConfig);
    const chains = (config.fallback as any).chains;

    expect(Object.keys(chains).sort()).toEqual([
      'designer',
      'explorer',
      'fixer',
      'librarian',
      'orchestrator',
      'reviewer',
    ]);
    expect(chains.orchestrator).toEqual([
      'openai/gpt-5.3-codex',
      'opencode/big-pickle',
    ]);
  });

  test('generateLiteConfig includes mcps field', () => {
    const config = generateLiteConfig(baseInstallConfig);
    const agents = (config.presets as any).manual;

    expect(agents.orchestrator.mcps).toBeDefined();
    expect(Array.isArray(agents.orchestrator.mcps)).toBe(true);
    expect(agents.librarian.mcps).toContain('websearch');
    expect(agents.librarian.mcps).toContain('context7');
    expect(agents.librarian.mcps).toContain('grep_app');
  });

  test('generateLiteConfig enables tmux when requested', () => {
    const config = generateLiteConfig({
      ...baseInstallConfig,
      hasTmux: true,
    });

    expect((config.tmux as any).enabled).toBe(true);
  });
});
