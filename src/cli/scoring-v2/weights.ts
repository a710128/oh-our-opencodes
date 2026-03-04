import type { FeatureWeights, ScoringAgentName } from './types';

const BASE_WEIGHTS: FeatureWeights = {
  status: 22,
  context: 6,
  output: 6,
  versionBonus: 8,
  reasoning: 10,
  toolcall: 16,
  attachment: 2,
  quality: 14,
  coding: 18,
  latencyPenalty: -3,
  pricePenalty: -2,
};

const AGENT_WEIGHT_OVERRIDES: Record<
  ScoringAgentName,
  Partial<FeatureWeights>
> = {
  orchestrator: {
    reasoning: 22,
    toolcall: 22,
    quality: 16,
    coding: 16,
    latencyPenalty: -2,
  },
  designer: {
    attachment: 12,
    output: 10,
    quality: 16,
    coding: 10,
  },
  explorer: {
    latencyPenalty: -8,
    toolcall: 24,
    reasoning: 2,
    context: 4,
    output: 4,
  },
  librarian: {
    context: 14,
    output: 10,
    quality: 18,
    coding: 14,
  },
  fixer: {
    coding: 28,
    toolcall: 22,
    reasoning: 12,
    output: 10,
  },
};

export function getFeatureWeights(agent: ScoringAgentName): FeatureWeights {
  return {
    ...BASE_WEIGHTS,
    ...AGENT_WEIGHT_OVERRIDES[agent],
  };
}
