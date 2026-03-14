import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  ensureConfigDir,
  getConfigDir,
  getExistingConfigPath,
  getExistingLiteConfigPath,
  getLiteConfig,
} from './paths';
import { generateLiteConfig } from './providers';
import type {
  ConfigMergeResult,
  DetectedConfig,
  InstallConfig,
  OpenCodeConfig,
} from './types';

const PACKAGE_NAME = 'oh-our-opencodes';

/**
 * Strip JSON comments (single-line // and multi-line) and trailing commas for JSONC support.
 */
export function stripJsonComments(json: string): string {
  const commentPattern = /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g;
  const trailingCommaPattern = /\\"|"(?:\\"|[^"])*"|(,)(\s*[}\]])/g;

  return json
    .replace(commentPattern, (match, commentGroup) =>
      commentGroup ? '' : match,
    )
    .replace(trailingCommaPattern, (match, comma, closing) =>
      comma ? closing : match,
    );
}

export function parseConfigFile(path: string): {
  config: OpenCodeConfig | null;
  error?: string;
} {
  try {
    if (!existsSync(path)) return { config: null };
    const stat = statSync(path);
    if (stat.size === 0) return { config: null };
    const content = readFileSync(path, 'utf-8');
    if (content.trim().length === 0) return { config: null };
    return { config: JSON.parse(stripJsonComments(content)) as OpenCodeConfig };
  } catch (err) {
    return { config: null, error: String(err) };
  }
}

export function parseConfig(path: string): {
  config: OpenCodeConfig | null;
  error?: string;
} {
  const result = parseConfigFile(path);
  if (result.config || result.error) return result;

  if (path.endsWith('.json')) {
    const jsoncPath = path.replace(/\.json$/, '.jsonc');
    return parseConfigFile(jsoncPath);
  }
  return { config: null };
}

/**
 * Write config to file atomically.
 */
export function writeConfig(configPath: string, config: OpenCodeConfig): void {
  if (configPath.endsWith('.jsonc')) {
    console.warn(
      '[config-manager] Writing to .jsonc file - comments will not be preserved',
    );
  }

  const tmpPath = `${configPath}.tmp`;
  const bakPath = `${configPath}.bak`;
  const content = `${JSON.stringify(config, null, 2)}\n`;

  // Backup existing config if it exists
  if (existsSync(configPath)) {
    copyFileSync(configPath, bakPath);
  }

  // Atomic write pattern: write to tmp, then rename
  writeFileSync(tmpPath, content);
  renameSync(tmpPath, configPath);
}

export async function addPluginToOpenCodeConfig(): Promise<ConfigMergeResult> {
  try {
    ensureConfigDir();
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: `Failed to create config directory: ${err}`,
    };
  }

  const configPath = getExistingConfigPath();

  try {
    const { config: parsedConfig, error } = parseConfig(configPath);
    if (error) {
      return {
        success: false,
        configPath,
        error: `Failed to parse config: ${error}`,
      };
    }
    const config = parsedConfig ?? {};
    const plugins = config.plugin ?? [];

    // Remove existing oh-our-opencodes entries
    const filteredPlugins = plugins.filter(
      (p) => p !== PACKAGE_NAME && !p.startsWith(`${PACKAGE_NAME}@`),
    );

    // Add fresh entry
    filteredPlugins.push(PACKAGE_NAME);
    config.plugin = filteredPlugins;

    writeConfig(configPath, config);
    return { success: true, configPath };
  } catch (err) {
    return {
      success: false,
      configPath,
      error: `Failed to update opencode config: ${err}`,
    };
  }
}

export function writeLiteConfig(
  installConfig: InstallConfig,
): ConfigMergeResult {
  const configPath = getExistingLiteConfigPath();

  try {
    ensureConfigDir();
    const config = generateLiteConfig(installConfig);

    if (configPath.endsWith('.jsonc')) {
      console.warn(
        '[config-manager] Writing to .jsonc lite config - comments will not be preserved',
      );
    }

    // Atomic write for lite config too
    const tmpPath = `${configPath}.tmp`;
    const bakPath = `${configPath}.bak`;
    const content = `${JSON.stringify(config, null, 2)}\n`;

    // Backup existing config if it exists
    if (existsSync(configPath)) {
      copyFileSync(configPath, bakPath);
    }

    writeFileSync(tmpPath, content);
    renameSync(tmpPath, configPath);

    return { success: true, configPath };
  } catch (err) {
    return {
      success: false,
      configPath,
      error: `Failed to write lite config: ${err}`,
    };
  }
}

export function disableDefaultAgents(): ConfigMergeResult {
  const configPath = getExistingConfigPath();

  try {
    ensureConfigDir();
    const { config: parsedConfig, error } = parseConfig(configPath);
    if (error) {
      return {
        success: false,
        configPath,
        error: `Failed to parse config: ${error}`,
      };
    }
    const config = parsedConfig ?? {};

    const agent = (config.agent ?? {}) as Record<string, unknown>;
    agent.explore = { disable: true };
    agent.general = { disable: true };
    config.agent = agent;

    writeConfig(configPath, config);
    return { success: true, configPath };
  } catch (err) {
    return {
      success: false,
      configPath,
      error: `Failed to disable default agents: ${err}`,
    };
  }
}

export function canModifyOpenCodeConfig(): boolean {
  try {
    const configPath = getExistingConfigPath();
    if (!existsSync(configPath)) return true; // Will be created
    const stat = statSync(configPath);
    // Check if writable - simple check for now
    return !!(stat.mode & 0o200);
  } catch {
    return false;
  }
}

export function detectCurrentConfig(): DetectedConfig {
  const result: DetectedConfig = {
    isInstalled: false,
    hasTmux: false,
  };

  const { config } = parseConfig(getExistingConfigPath());
  if (config) {
    const plugins = config.plugin ?? [];
    result.isInstalled = plugins.some((p) => p.startsWith(PACKAGE_NAME));
  }

  const { config: liteConfig } = parseConfig(getExistingLiteConfigPath());
  if (liteConfig && typeof liteConfig === 'object') {
    const configObj = liteConfig as Record<string, unknown>;
    if (configObj.tmux && typeof configObj.tmux === 'object') {
      const tmuxConfig = configObj.tmux as { enabled?: boolean };
      result.hasTmux = tmuxConfig.enabled === true;
    }
  }

  return result;
}
