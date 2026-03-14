import { describe, expect, test } from 'bun:test';
import type { PluginConfig } from '../config';
import { SUBAGENT_NAMES } from '../config';
import { createAgents, getAgentConfigs, isSubagent } from './index';

describe('agent alias backward compatibility', () => {
  test("applies 'explore' config to 'explorer' agent", () => {
    const config: PluginConfig = {
      agents: {
        explore: { model: 'test/old-explore-model' },
      },
    };
    const agents = createAgents(config);
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer).toBeDefined();
    expect(explorer?.config.model).toBe('test/old-explore-model');
  });

  test("applies 'frontend-ui-ux-engineer' config to 'designer' agent", () => {
    const config: PluginConfig = {
      agents: {
        'frontend-ui-ux-engineer': { model: 'test/old-frontend-model' },
      },
    };
    const agents = createAgents(config);
    const designer = agents.find((a) => a.name === 'designer');
    expect(designer).toBeDefined();
    expect(designer?.config.model).toBe('test/old-frontend-model');
  });

  test('new name takes priority over old alias', () => {
    const config: PluginConfig = {
      agents: {
        explore: { model: 'old-model' },
        explorer: { model: 'new-model' },
      },
    };
    const agents = createAgents(config);
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer?.config.model).toBe('new-model');
  });

  test('new agent names work directly', () => {
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'direct-explorer' },
        designer: { model: 'direct-designer' },
      },
    };
    const agents = createAgents(config);
    expect(agents.find((a) => a.name === 'explorer')?.config.model).toBe(
      'direct-explorer',
    );
    expect(agents.find((a) => a.name === 'designer')?.config.model).toBe(
      'direct-designer',
    );
  });

  test('temperature override via old alias', () => {
    const config: PluginConfig = {
      agents: {
        explore: { temperature: 0.5 },
      },
    };
    const agents = createAgents(config);
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer?.config.temperature).toBe(0.5);
  });

  test('variant override via old alias', () => {
    const config: PluginConfig = {
      agents: {
        explore: { variant: 'low' },
      },
    };
    const agents = createAgents(config);
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer?.config.variant).toBe('low');
  });
});

describe('fixer agent fallback', () => {
  test('fixer inherits librarian model when no fixer config provided', () => {
    const config: PluginConfig = {
      agents: {
        librarian: { model: 'librarian-custom-model' },
      },
    };
    const agents = createAgents(config);
    const fixer = agents.find((a) => a.name === 'fixer');
    const librarian = agents.find((a) => a.name === 'librarian');
    expect(fixer?.config.model).toBe(librarian?.config.model);
  });

  test('fixer uses its own model when explicitly configured', () => {
    const config: PluginConfig = {
      agents: {
        librarian: { model: 'librarian-model' },
        fixer: { model: 'fixer-specific-model' },
      },
    };
    const agents = createAgents(config);
    const fixer = agents.find((a) => a.name === 'fixer');
    expect(fixer?.config.model).toBe('fixer-specific-model');
  });
});

describe('orchestrator agent', () => {
  test('orchestrator is first in agents array', () => {
    const agents = createAgents();
    expect(agents[0].name).toBe('orchestrator');
  });

  test('orchestrator has question permission set to allow', () => {
    const agents = createAgents();
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.permission).toBeDefined();
    expect((orchestrator?.config.permission as any).question).toBe('allow');
  });

  test('orchestrator accepts overrides', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: { model: 'custom-orchestrator-model', temperature: 0.3 },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.model).toBe('custom-orchestrator-model');
    expect(orchestrator?.config.temperature).toBe(0.3);
  });

  test('orchestrator accepts variant override', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: { variant: 'high' },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.variant).toBe('high');
  });
});

describe('question permissions', () => {
  test('explorer has question permission set to deny', () => {
    const agents = createAgents();
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer?.config.permission).toBeDefined();
    expect((explorer?.config.permission as any).question).toBe('deny');
  });

  test('fixer has question permission set to deny', () => {
    const agents = createAgents();
    const fixer = agents.find((a) => a.name === 'fixer');
    expect(fixer?.config.permission).toBeDefined();
    expect((fixer?.config.permission as any).question).toBe('deny');
  });

  test('reviewer has question permission set to deny', () => {
    const agents = createAgents();
    const reviewer = agents.find((a) => a.name === 'reviewer');
    expect(reviewer?.config.permission).toBeDefined();
    expect((reviewer?.config.permission as any).question).toBe('deny');
  });
});

describe('skill permissions', () => {
  test('orchestrator allows skill wildcard by default', () => {
    const agents = createAgents();
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator).toBeDefined();
    const skillPerm = (
      orchestrator?.config.permission as Record<string, unknown>
    )?.skill as Record<string, string>;
    expect(skillPerm?.['*']).toBe('allow');
  });

  test('explorer denies skill wildcard by default', () => {
    const agents = createAgents();
    const explorer = agents.find((a) => a.name === 'explorer');
    expect(explorer).toBeDefined();
    const skillPerm = (explorer?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['*']).toBe('deny');
  });

  test('reviewer denies skill wildcard by default', () => {
    const agents = createAgents();
    const reviewer = agents.find((a) => a.name === 'reviewer');
    expect(reviewer).toBeDefined();
    const skillPerm = (reviewer?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['*']).toBe('deny');
  });
});

describe('isSubagent type guard', () => {
  test('returns true for valid subagent names', () => {
    expect(isSubagent('explorer')).toBe(true);
    expect(isSubagent('librarian')).toBe(true);
    expect(isSubagent('designer')).toBe(true);
    expect(isSubagent('fixer')).toBe(true);
    expect(isSubagent('reviewer')).toBe(true);
  });

  test('returns false for orchestrator', () => {
    expect(isSubagent('orchestrator')).toBe(false);
  });

  test('returns false for invalid agent names', () => {
    expect(isSubagent('invalid-agent')).toBe(false);
    expect(isSubagent('')).toBe(false);
    expect(isSubagent('explore')).toBe(false); // old alias, not actual agent name
  });
});

describe('agent classification', () => {
  test('SUBAGENT_NAMES excludes orchestrator', () => {
    expect(SUBAGENT_NAMES).not.toContain('orchestrator');
    expect(SUBAGENT_NAMES).toContain('explorer');
    expect(SUBAGENT_NAMES).toContain('fixer');
    expect(SUBAGENT_NAMES).toContain('reviewer');
  });

  test('getAgentConfigs applies correct classification visibility and mode', () => {
    const configs = getAgentConfigs();

    // Primary agent
    expect(configs.orchestrator.mode).toBe('primary');

    // Subagents
    for (const name of SUBAGENT_NAMES) {
      expect(configs[name].mode).toBe('subagent');
    }
  });
});

describe('createAgents', () => {
  test('creates all agents without config', () => {
    const agents = createAgents();
    const names = agents.map((a) => a.name);
    expect(names).toContain('orchestrator');
    expect(names).toContain('explorer');
    expect(names).toContain('designer');
    expect(names).toContain('librarian');
    expect(names).toContain('fixer');
    expect(names).toContain('reviewer');
  });

  test('creates exactly 6 agents (1 primary + 5 subagents)', () => {
    const agents = createAgents();
    expect(agents.length).toBe(6);
  });
});

describe('getAgentConfigs', () => {
  test('returns config record keyed by agent name', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator).toBeDefined();
    expect(configs.explorer).toBeDefined();
    expect(configs.orchestrator.model).toBeDefined();
  });

  test('includes description in SDK config', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator.description).toBeDefined();
    expect(configs.explorer.description).toBeDefined();
  });
});
