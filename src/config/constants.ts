// Agent names
export const AGENT_ALIASES: Record<string, string> = {
  explore: 'explorer',
  'frontend-ui-ux-engineer': 'designer',
};

export const SUBAGENT_NAMES = [
  'explorer',
  'librarian',
  'designer',
  'fixer',
] as const;

export const ORCHESTRATOR_NAME = 'orchestrator' as const;

export const ALL_AGENT_NAMES = [ORCHESTRATOR_NAME, ...SUBAGENT_NAMES] as const;

// Agent name type (for use in DEFAULT_MODELS)
export type AgentName = (typeof ALL_AGENT_NAMES)[number];

// Subagent delegation rules: which agents can spawn which subagents
// orchestrator: can spawn all subagents (full delegation)
// fixer: leaf node — prompt forbids delegation; use grep/glob for lookups
// designer: can spawn explorer (for research during design)
// explorer/librarian: cannot spawn any subagents (leaf nodes)
// Unknown agent types not listed here default to explorer-only access
export const SUBAGENT_DELEGATION_RULES: Record<AgentName, readonly string[]> = {
  orchestrator: SUBAGENT_NAMES,
  fixer: [],
  designer: [],
  explorer: [],
  librarian: [],
};

// Default models for each agent
export const DEFAULT_MODELS: Record<AgentName, string> = {
  orchestrator: 'kimi-for-coding/k2p5',
  librarian: 'openai/gpt-5.1-codex-mini',
  explorer: 'openai/gpt-5.1-codex-mini',
  designer: 'kimi-for-coding/k2p5',
  fixer: 'openai/gpt-5.1-codex-mini',
};

// Default temperatures per agent (single source of truth for runtime defaults
// and template generation).
export const DEFAULT_AGENT_TEMPERATURES: Record<AgentName, number> = {
  orchestrator: 0.1,
  librarian: 0.1,
  explorer: 0.1,
  designer: 0.7,
  fixer: 0.2,
};

// Default MCPs per agent - "*" means all MCPs, "!item" excludes specific MCPs.
export const DEFAULT_AGENT_MCPS: Record<AgentName, string[]> = {
  orchestrator: ['websearch'],
  designer: [],
  librarian: ['websearch', 'context7', 'grep_app'],
  explorer: [],
  fixer: [],
};

export const DEFAULT_TMUX_CONFIG = {
  enabled: false,
  layout: 'main-vertical',
  main_pane_size: 60,
} as const;

export const DEFAULT_BACKGROUND_CONFIG = {
  maxConcurrentStarts: 10,
} as const;

export const DEFAULT_FAILOVER_CONFIG = {
  enabled: true,
  timeoutMs: 15000,
  chains: {},
} as const;

// Polling configuration
export const POLL_INTERVAL_MS = 500;
export const POLL_INTERVAL_SLOW_MS = 1000;
export const POLL_INTERVAL_BACKGROUND_MS = 2000;

// Timeouts
export const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const FALLBACK_FAILOVER_TIMEOUT_MS = 15_000;

// Polling stability
export const STABLE_POLLS_THRESHOLD = 3;
