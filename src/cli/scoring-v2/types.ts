import type { DiscoveredModel, ExternalSignalMap } from '../types';

export type ScoreFeatureName =
  | 'status'
  | 'context'
  | 'output'
  | 'versionBonus'
  | 'reasoning'
  | 'toolcall'
  | 'attachment'
  | 'quality'
  | 'coding'
  | 'latencyPenalty'
  | 'pricePenalty';

export type FeatureVector = Record<ScoreFeatureName, number>;

export type FeatureWeights = Record<ScoreFeatureName, number>;

export type ScoringAgentName =
  | 'orchestrator'
  | 'designer'
  | 'explorer'
  | 'librarian'
  | 'fixer';

export interface ScoringContext {
  agent: ScoringAgentName;
  externalSignals?: ExternalSignalMap;
}

export interface ScoredCandidate {
  model: DiscoveredModel;
  totalScore: number;
  scoreBreakdown: {
    features: FeatureVector;
    weighted: FeatureVector;
  };
}
