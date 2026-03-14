/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  disableDefaultAgents,
  parseConfig,
  parseConfigFile,
  stripJsonComments,
  writeConfig,
  writeLiteConfig,
} from './config-io';
import * as paths from './paths';

describe('config-io', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'opencode-io-test-'));
    process.env.XDG_CONFIG_HOME = tmpDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    mock.restore();
  });

  test('stripJsonComments strips comments and trailing commas', () => {
    const jsonc = `{
      // comment
      "a": 1, /* multi
      line */
      "b": [2,],
    }`;
    const stripped = stripJsonComments(jsonc);
    expect(JSON.parse(stripped)).toEqual({ a: 1, b: [2] });
  });

  test('parseConfigFile parses valid JSON', () => {
    const path = join(tmpDir, 'test.json');
    writeFileSync(path, '{"a": 1}');
    const result = parseConfigFile(path);
    expect(result.config).toEqual({ a: 1 } as any);
    expect(result.error).toBeUndefined();
  });

  test('parseConfigFile returns null for non-existent file', () => {
    const result = parseConfigFile(join(tmpDir, 'nonexistent.json'));
    expect(result.config).toBeNull();
  });

  test('parseConfigFile returns null for empty or whitespace-only file', () => {
    const emptyPath = join(tmpDir, 'empty.json');
    writeFileSync(emptyPath, '');
    expect(parseConfigFile(emptyPath).config).toBeNull();

    const whitespacePath = join(tmpDir, 'whitespace.json');
    writeFileSync(whitespacePath, '   \n  ');
    expect(parseConfigFile(whitespacePath).config).toBeNull();
  });

  test('parseConfigFile returns error for invalid JSON', () => {
    const path = join(tmpDir, 'invalid.json');
    writeFileSync(path, '{"a": 1');
    const result = parseConfigFile(path);
    expect(result.config).toBeNull();
    expect(result.error).toBeDefined();
  });

  test('parseConfig tries .jsonc if .json is missing', () => {
    const jsoncPath = join(tmpDir, 'test.jsonc');
    writeFileSync(jsoncPath, '{"a": 1}');

    // We pass .json path, it should try .jsonc
    const result = parseConfig(join(tmpDir, 'test.json'));
    expect(result.config).toEqual({ a: 1 } as any);
  });

  test('writeConfig writes JSON and creates backup', () => {
    const path = join(tmpDir, 'test.json');
    writeFileSync(path, '{"old": true}');

    writeConfig(path, { new: true } as any);

    expect(JSON.parse(readFileSync(path, 'utf-8'))).toEqual({ new: true });
    expect(JSON.parse(readFileSync(`${path}.bak`, 'utf-8'))).toEqual({
      old: true,
    });
  });

  test('addPluginToOpenCodeConfig adds plugin and removes duplicates', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({ plugin: ['other', 'oh-our-opencodes@1.0.0'] }),
    );

    const result = await addPluginToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toContain('oh-our-opencodes');
    expect(saved.plugin).not.toContain('oh-our-opencodes@1.0.0');
    expect(saved.plugin.length).toBe(2);
  });

  test('writeLiteConfig writes lite config', () => {
    const litePath = join(tmpDir, 'opencode', 'oh-our-opencodes.json');
    paths.ensureConfigDir();

    const result = writeLiteConfig({
      hasTmux: true,
      installSkills: false,
      installCustomSkills: false,
      manualAgentConfigs: {
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
      },
    });
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(litePath, 'utf-8'));
    expect(saved.preset).toBe('manual');
    expect(saved.presets.manual).toBeDefined();
    expect(saved.tmux.enabled).toBe(true);
  });

  test('writeLiteConfig prefers existing jsonc lite config path', () => {
    const jsonPath = join(tmpDir, 'opencode', 'oh-our-opencodes.json');
    const jsoncPath = join(tmpDir, 'opencode', 'oh-our-opencodes.jsonc');
    const warn = mock(() => {});

    paths.ensureConfigDir();
    writeFileSync(jsonPath, JSON.stringify({ preset: 'stale' }));
    writeFileSync(
      jsoncPath,
      '{\n  // keep me visible\n  "preset": "manual"\n}\n',
    );
    console.warn = warn as typeof console.warn;

    const result = writeLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
      manualAgentConfigs: {
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
      },
    });

    expect(result.success).toBe(true);
    expect(result.configPath).toBe(jsoncPath);
    expect(JSON.parse(readFileSync(jsoncPath, 'utf-8')).preset).toBe('manual');
    expect(JSON.parse(readFileSync(jsonPath, 'utf-8')).preset).toBe('stale');
    expect(warn).toHaveBeenCalledWith(
      '[config-manager] Writing to .jsonc lite config - comments will not be preserved',
    );
  });

  test('detectCurrentConfig prefers jsonc lite config when both files exist', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const jsonPath = join(tmpDir, 'opencode', 'oh-our-opencodes.json');
    const jsoncPath = join(tmpDir, 'opencode', 'oh-our-opencodes.jsonc');
    paths.ensureConfigDir();

    writeFileSync(configPath, JSON.stringify({ plugin: ['oh-our-opencodes'] }));
    writeFileSync(
      jsonPath,
      JSON.stringify({
        preset: 'manual',
        tmux: { enabled: false },
      }),
    );
    writeFileSync(
      jsoncPath,
      JSON.stringify({
        preset: 'manual',
        tmux: { enabled: true },
      }),
    );

    const detected = detectCurrentConfig();
    expect(detected.isInstalled).toBe(true);
    expect(detected.hasTmux).toBe(true);
  });

  test('disableDefaultAgents disables explore and general agents', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({}));

    const result = disableDefaultAgents();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.agent.explore.disable).toBe(true);
    expect(saved.agent.general.disable).toBe(true);
  });

  test('detectCurrentConfig detects installed status and tmux', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const litePath = join(tmpDir, 'opencode', 'oh-our-opencodes.json');
    paths.ensureConfigDir();

    writeFileSync(configPath, JSON.stringify({ plugin: ['oh-our-opencodes'] }));
    writeFileSync(
      litePath,
      JSON.stringify({
        preset: 'manual',
        presets: {
          manual: {
            orchestrator: { model: 'openai/gpt-4' },
            designer: { model: 'anthropic/claude-opus-4-6' },
            explorer: { model: 'github-copilot/grok-code-fast-1' },
            librarian: { model: 'zai-coding-plan/glm-4.7' },
          },
        },
        tmux: { enabled: true },
      }),
    );

    const detected = detectCurrentConfig();
    expect(detected.isInstalled).toBe(true);
    expect(detected.hasTmux).toBe(true);
  });
});
