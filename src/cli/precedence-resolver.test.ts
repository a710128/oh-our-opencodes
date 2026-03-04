/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { resolveAgentWithPrecedence } from './precedence-resolver';

describe('precedence-resolver', () => {
  test('resolves deterministic winner with provenance', () => {
    const result = resolveAgentWithPrecedence({
      agentName: 'orchestrator',
      manualUserPlan: ['openai/gpt-5.3-codex', 'openai/gpt-5.1-codex-mini'],
      dynamicRecommendation: ['anthropic/claude-opus-4-6'],
      providerFallbackPolicy: ['chutes/kimi-k2.5'],
      systemDefault: ['opencode/big-pickle'],
    });

    expect(result.model).toBe('openai/gpt-5.3-codex');
    expect(result.provenance.winnerLayer).toBe('manual-user-plan');
    expect(result.chain).toEqual([
      'openai/gpt-5.3-codex',
      'openai/gpt-5.1-codex-mini',
      'anthropic/claude-opus-4-6',
      'chutes/kimi-k2.5',
      'opencode/big-pickle',
    ]);
  });

  test('uses system default when no other layer is provided', () => {
    const result = resolveAgentWithPrecedence({
      agentName: 'explorer',
      systemDefault: ['opencode/gpt-5-nano'],
    });

    expect(result.model).toBe('opencode/gpt-5-nano');
    expect(result.provenance.winnerLayer).toBe('system-default');
    expect(result.chain).toEqual(['opencode/gpt-5-nano']);
  });
});
