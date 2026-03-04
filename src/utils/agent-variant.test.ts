import { describe, expect, test } from 'bun:test';
import type { PluginConfig } from '../config';
import {
  applyAgentVariant,
  normalizeAgentName,
  resolveAgentVariant,
} from './agent-variant';

describe('normalizeAgentName', () => {
  test('returns name unchanged if no @ prefix', () => {
    expect(normalizeAgentName('designer')).toBe('designer');
  });

  test('strips @ prefix from agent name', () => {
    expect(normalizeAgentName('@designer')).toBe('designer');
  });

  test('trims whitespace', () => {
    expect(normalizeAgentName('  designer  ')).toBe('designer');
  });

  test('handles @ prefix with whitespace', () => {
    expect(normalizeAgentName('  @explore  ')).toBe('explore');
  });

  test('handles empty string', () => {
    expect(normalizeAgentName('')).toBe('');
  });
});

describe('resolveAgentVariant', () => {
  test('returns undefined when config is undefined', () => {
    expect(resolveAgentVariant(undefined, 'designer')).toBeUndefined();
  });

  test('returns undefined when agents is undefined', () => {
    const config = {} as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBeUndefined();
  });

  test('returns undefined when agent has no variant', () => {
    const config = {
      agents: {
        designer: { model: 'gpt-4' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBeUndefined();
  });

  test('returns variant when configured', () => {
    const config = {
      agents: {
        designer: { variant: 'high' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBe('high');
  });

  test('normalizes agent name with @ prefix', () => {
    const config = {
      agents: {
        designer: { variant: 'low' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, '@designer')).toBe('low');
  });

  test('returns undefined for empty string variant', () => {
    const config = {
      agents: {
        designer: { variant: '' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBeUndefined();
  });

  test('returns undefined for whitespace-only variant', () => {
    const config = {
      agents: {
        designer: { variant: '   ' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBeUndefined();
  });

  test('trims variant whitespace', () => {
    const config = {
      agents: {
        designer: { variant: '  medium  ' },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBe('medium');
  });

  test('returns undefined for non-string variant', () => {
    const config = {
      agents: {
        designer: { variant: 123 as unknown as string },
      },
    } as PluginConfig;
    expect(resolveAgentVariant(config, 'designer')).toBeUndefined();
  });
});

describe('applyAgentVariant', () => {
  test('returns body unchanged when variant is undefined', () => {
    const body = { agent: 'designer', parts: [] };
    const result = applyAgentVariant(undefined, body);
    expect(result).toEqual(body);
    expect(result).toBe(body); // Same reference
  });

  test('returns body unchanged when body already has variant', () => {
    const body = { agent: 'designer', variant: 'medium', parts: [] };
    const result = applyAgentVariant('high', body);
    expect(result.variant).toBe('medium');
    expect(result).toBe(body); // Same reference
  });

  test('applies variant to body without variant', () => {
    const body = { agent: 'designer', parts: [] };
    const result = applyAgentVariant('high', body);
    expect(result.variant).toBe('high');
    expect(result.agent).toBe('designer');
    expect(result).not.toBe(body); // New object
  });

  test('preserves all existing body properties', () => {
    const body = {
      agent: 'designer',
      parts: [{ type: 'text' as const, text: 'hello' }],
      tools: { background_task: false },
    };
    const result = applyAgentVariant('low', body);
    expect(result.agent).toBe('designer');
    expect(result.parts).toEqual([{ type: 'text', text: 'hello' }]);
    expect(result.tools).toEqual({ background_task: false });
    expect(result.variant).toBe('low');
  });
});
