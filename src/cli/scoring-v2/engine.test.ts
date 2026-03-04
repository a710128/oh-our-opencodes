/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import type { DiscoveredModel, ExternalSignalMap } from '../types';
import { rankModelsV2, scoreCandidateV2 } from './engine';

function model(
  input: Partial<DiscoveredModel> & { model: string },
): DiscoveredModel {
  const [providerID] = input.model.split('/');
  return {
    providerID: providerID ?? 'openai',
    model: input.model,
    name: input.name ?? input.model,
    status: input.status ?? 'active',
    contextLimit: input.contextLimit ?? 200000,
    outputLimit: input.outputLimit ?? 32000,
    reasoning: input.reasoning ?? true,
    toolcall: input.toolcall ?? true,
    attachment: input.attachment ?? false,
    dailyRequestLimit: input.dailyRequestLimit,
    costInput: input.costInput,
    costOutput: input.costOutput,
  };
}

describe('scoring-v2', () => {
  test('returns explain breakdown with deterministic total', () => {
    const candidate = model({ model: 'openai/gpt-5.3-codex' });
    const signalMap: ExternalSignalMap = {
      'openai/gpt-5.3-codex': {
        source: 'artificial-analysis',
        qualityScore: 70,
        codingScore: 75,
        latencySeconds: 1.2,
        inputPricePer1M: 1,
        outputPricePer1M: 3,
      },
    };

    const first = scoreCandidateV2(candidate, 'orchestrator', signalMap);
    const second = scoreCandidateV2(candidate, 'orchestrator', signalMap);

    expect(first.totalScore).toBe(second.totalScore);
    expect(first.scoreBreakdown.features.quality).toBe(0.7);
    expect(first.scoreBreakdown.weighted.coding).toBeGreaterThan(0);
  });

  test('uses stable tie-break when scores are equal', () => {
    const ranked = rankModelsV2(
      [
        model({ model: 'zai-coding-plan/glm-4.7', reasoning: false }),
        model({ model: 'openai/gpt-5.3-codex', reasoning: false }),
      ],
      'explorer',
    );

    expect(ranked[0]?.model.providerID).toBe('openai');
    expect(ranked[1]?.model.providerID).toBe('zai-coding-plan');
  });

  test('matches external signals for multi-segment chutes ids', () => {
    const candidate = model({
      model: 'chutes/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8-TEE',
    });
    const signalMap: ExternalSignalMap = {
      'qwen/qwen3-coder-480b-a35b-instruct': {
        source: 'artificial-analysis',
        qualityScore: 95,
        codingScore: 92,
      },
    };

    const scored = scoreCandidateV2(candidate, 'fixer', signalMap);
    expect(scored.scoreBreakdown.features.quality).toBe(0.95);
    expect(scored.scoreBreakdown.features.coding).toBe(0.92);
  });

  test('applies designer output threshold rule', () => {
    const belowThreshold = model({
      model: 'chutes/moonshotai/Kimi-K2.5-TEE',
      outputLimit: 63999,
    });
    const aboveThreshold = model({
      model: 'zai-coding-plan/glm-4.7',
      outputLimit: 64000,
    });

    const low = scoreCandidateV2(belowThreshold, 'designer');
    const high = scoreCandidateV2(aboveThreshold, 'designer');

    expect(low.scoreBreakdown.features.output).toBe(-1);
    expect(low.scoreBreakdown.weighted.output).toBe(-10);
    expect(high.scoreBreakdown.features.output).toBe(0);
    expect(high.scoreBreakdown.weighted.output).toBe(0);
  });

  test('prefers kimi k2.5 over kimi k2 when otherwise equal', () => {
    const ranked = rankModelsV2(
      [
        model({
          model: 'chutes/moonshotai/Kimi-K2-TEE',
          contextLimit: 262144,
          outputLimit: 65535,
          reasoning: true,
          toolcall: true,
          attachment: false,
        }),
        model({
          model: 'chutes/moonshotai/Kimi-K2.5-TEE',
          contextLimit: 262144,
          outputLimit: 65535,
          reasoning: true,
          toolcall: true,
          attachment: false,
        }),
      ],
      'designer',
    );

    expect(ranked[0]?.model.model).toBe('chutes/moonshotai/Kimi-K2.5-TEE');
    expect(ranked[1]?.model.model).toBe('chutes/moonshotai/Kimi-K2-TEE');
  });

  test('downranks chutes qwen3 against kimi/minimax priors', () => {
    const ranked = rankModelsV2(
      [
        model({
          model: 'chutes/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8-TEE',
          contextLimit: 262144,
          outputLimit: 262144,
          reasoning: true,
          toolcall: true,
        }),
        model({
          model: 'chutes/moonshotai/Kimi-K2.5-TEE',
          contextLimit: 262144,
          outputLimit: 65535,
          reasoning: true,
          toolcall: true,
        }),
        model({
          model: 'chutes/minimax-m2.1',
          contextLimit: 500000,
          outputLimit: 64000,
          reasoning: true,
          toolcall: true,
        }),
      ],
      'fixer',
    );

    expect(ranked[0]?.model.model).not.toContain('Qwen3-Coder-480B');
  });
});
