import { buildModelKeyAliases } from '../model-key-normalization';
import type {
  DiscoveredModel,
  ExternalModelSignal,
  ExternalSignalMap,
} from '../types';
import type { FeatureVector, ScoringAgentName } from './types';

function modelLookupKeys(model: DiscoveredModel): string[] {
  return buildModelKeyAliases(model.model);
}

function findSignal(
  model: DiscoveredModel,
  externalSignals?: ExternalSignalMap,
): ExternalModelSignal | undefined {
  if (!externalSignals) return undefined;
  return modelLookupKeys(model)
    .map((key) => externalSignals[key])
    .find((item) => item !== undefined);
}

function statusValue(status: DiscoveredModel['status']): number {
  if (status === 'active') return 1;
  if (status === 'beta') return 0.4;
  if (status === 'alpha') return -0.25;
  return -1;
}

function capability(value: boolean): number {
  return value ? 1 : 0;
}

function blendedPrice(signal: ExternalModelSignal | undefined): number {
  if (!signal) return 0;
  if (
    signal.inputPricePer1M !== undefined &&
    signal.outputPricePer1M !== undefined
  ) {
    return signal.inputPricePer1M * 0.75 + signal.outputPricePer1M * 0.25;
  }
  return signal.inputPricePer1M ?? signal.outputPricePer1M ?? 0;
}

function kimiVersionBonus(
  agent: ScoringAgentName,
  model: DiscoveredModel,
): number {
  const lowered = `${model.model} ${model.name}`.toLowerCase();
  const isChutes = model.providerID === 'chutes';
  const isQwen3 = isChutes && /qwen3/.test(lowered);
  const isKimiK25 = /kimi-k2\.5|k2\.5/.test(lowered);
  const isMinimaxM21 = isChutes && /minimax[-_ ]?m2\.1/.test(lowered);

  const qwenPenalty: Record<ScoringAgentName, number> = {
    orchestrator: -6,
    designer: -8,
    explorer: -6,
    librarian: -12,
    fixer: -12,
  };
  const kimiBonus: Record<ScoringAgentName, number> = {
    orchestrator: 1,
    designer: 3,
    explorer: 2,
    librarian: 2,
    fixer: 3,
  };
  const minimaxBonus: Record<ScoringAgentName, number> = {
    orchestrator: 1,
    designer: 2,
    explorer: 4,
    librarian: 4,
    fixer: 4,
  };

  if (isQwen3) return qwenPenalty[agent];
  if (isKimiK25) return kimiBonus[agent];
  if (isMinimaxM21) return minimaxBonus[agent];
  return 0;
}

export function extractFeatureVector(
  model: DiscoveredModel,
  agent: ScoringAgentName,
  externalSignals?: ExternalSignalMap,
): FeatureVector {
  const signal = findSignal(model, externalSignals);
  const latency = signal?.latencySeconds ?? 0;
  const normalizedContext = Math.min(model.contextLimit, 1_000_000) / 100_000;
  const normalizedOutput = Math.min(model.outputLimit, 300_000) / 30_000;
  const designerOutputScore = model.outputLimit < 64_000 ? -1 : 0;
  const versionBonus = kimiVersionBonus(agent, model);
  const quality = (signal?.qualityScore ?? 0) / 100;
  const coding = (signal?.codingScore ?? 0) / 100;
  const pricePenalty = Math.min(blendedPrice(signal), 50) / 10;

  const explorerLatencyMultiplier = agent === 'explorer' ? 1.4 : 1;

  return {
    status: statusValue(model.status),
    context: normalizedContext,
    output: agent === 'designer' ? designerOutputScore : normalizedOutput,
    versionBonus,
    reasoning: capability(model.reasoning),
    toolcall: capability(model.toolcall),
    attachment: capability(model.attachment),
    quality,
    coding,
    latencyPenalty: Math.min(latency, 20) * explorerLatencyMultiplier,
    pricePenalty,
  };
}
