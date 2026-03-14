export type BooleanArg = 'yes' | 'no';

export interface InstallArgs {
  tui: boolean;
  model?: string;
  tmux?: BooleanArg;
  skills?: BooleanArg;
  dryRun?: boolean;
  modelsOnly?: boolean;
  unknownArgs?: string[];
}

export interface OpenCodeFreeModel {
  providerID: string;
  model: string;
  name: string;
  status: 'alpha' | 'beta' | 'deprecated' | 'active';
  contextLimit: number;
  outputLimit: number;
  reasoning: boolean;
  toolcall: boolean;
  attachment: boolean;
  dailyRequestLimit?: number;
}

export interface DiscoveredModel {
  providerID: string;
  model: string;
  name: string;
  status: 'alpha' | 'beta' | 'deprecated' | 'active';
  contextLimit: number;
  outputLimit: number;
  reasoning: boolean;
  toolcall: boolean;
  attachment: boolean;
  dailyRequestLimit?: number;
  costInput?: number;
  costOutput?: number;
}

export type ManualAgentConfig = {
  primary: string;
  fallback1: string;
  fallback2: string;
  fallback3: string;
};

export type ManualAgentName =
  | 'orchestrator'
  | 'designer'
  | 'explorer'
  | 'librarian'
  | 'fixer'
  | 'reviewer';

export type ManualAgentConfigs = Record<ManualAgentName, ManualAgentConfig>;

export interface OpenCodeConfig {
  plugin?: string[];
  provider?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InstallConfig {
  hasTmux: boolean;
  installSkills: boolean;
  installCustomSkills: boolean;
  manualAgentConfigs: ManualAgentConfigs;
  dryRun?: boolean;
  modelsOnly?: boolean;
}

export interface ConfigMergeResult {
  success: boolean;
  configPath: string;
  error?: string;
}

export interface DetectedConfig {
  isInstalled: boolean;
  hasTmux: boolean;
}
