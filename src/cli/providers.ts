import { DEFAULT_AGENT_MCPS } from '../config/constants';
import { CUSTOM_SKILLS } from './custom-skills';
import { RECOMMENDED_SKILLS } from './skills';
import type { InstallConfig } from './types';

const AGENT_NAMES = [
  'orchestrator',
  'designer',
  'explorer',
  'librarian',
  'fixer',
  'reviewer',
] as const;

function getDefaultSkillsForAgent(agentName: string): string[] {
  const recommended = RECOMMENDED_SKILLS.filter(
    (s) => s.allowedAgents.includes('*') || s.allowedAgents.includes(agentName),
  ).map((s) => s.skillName);

  const bundled = CUSTOM_SKILLS.filter(
    (s) => s.allowedAgents.includes('*') || s.allowedAgents.includes(agentName),
  ).map((s) => s.name);

  return Array.from(new Set([...recommended, ...bundled]));
}

function createAgentConfig(
  agentName: string,
  modelInfo: { model: string; variant?: string },
) {
  const isOrchestrator = agentName === 'orchestrator';
  const skills = isOrchestrator ? ['*'] : getDefaultSkillsForAgent(agentName);

  if (agentName === 'designer' && !skills.includes('agent-browser')) {
    skills.push('agent-browser');
  }

  return {
    model: modelInfo.model,
    variant: modelInfo.variant,
    skills,
    mcps:
      DEFAULT_AGENT_MCPS[agentName as keyof typeof DEFAULT_AGENT_MCPS] ?? [],
  };
}

export function generateLiteConfig(
  installConfig: InstallConfig,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    preset: 'manual',
    presets: {},
  };

  const manualPreset: Record<string, unknown> = {};
  const chains: Record<string, string[]> = {};

  for (const agentName of AGENT_NAMES) {
    const manualConfig = installConfig.manualAgentConfigs[agentName];

    manualPreset[agentName] = createAgentConfig(agentName, {
      model: manualConfig.primary,
    });

    const fallbackChain = [
      manualConfig.primary,
      manualConfig.fallback1,
      manualConfig.fallback2,
      manualConfig.fallback3,
    ].filter((model, index, all) => model && all.indexOf(model) === index);

    chains[agentName] = fallbackChain;
  }

  const hasFallbacks = Object.values(chains).some((chain) => chain.length > 1);

  (config.presets as Record<string, unknown>).manual = manualPreset;
  config.fallback = {
    enabled: hasFallbacks,
    timeoutMs: 15000,
    chains,
  };

  if (installConfig.hasTmux) {
    config.tmux = {
      enabled: true,
      layout: 'main-vertical',
      main_pane_size: 60,
    };
  }

  return config;
}
