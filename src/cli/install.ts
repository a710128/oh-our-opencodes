import * as readline from 'node:readline/promises';
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  disableDefaultAgents,
  discoverModelCatalog,
  generateLiteConfig,
  getOpenCodePath,
  getOpenCodeVersion,
  isOpenCodeInstalled,
  writeLiteConfig,
} from './config-manager';
import { CUSTOM_SKILLS, installCustomSkill } from './custom-skills';
import { installSkill, RECOMMENDED_SKILLS } from './skills';
import type {
  BooleanArg,
  ConfigMergeResult,
  DetectedConfig,
  InstallArgs,
  InstallConfig,
  ManualAgentConfig,
} from './types';

// Colors
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const SYMBOLS = {
  check: `${GREEN}✓${RESET}`,
  cross: `${RED}✗${RESET}`,
  arrow: `${BLUE}→${RESET}`,
  bullet: `${DIM}•${RESET}`,
  info: `${BLUE}ℹ${RESET}`,
  warn: `${YELLOW}⚠${RESET}`,
  star: `${YELLOW}★${RESET}`,
};

function printHeader(isUpdate: boolean): void {
  console.log();
  console.log(
    `${BOLD}oh-our-opencodes ${isUpdate ? 'Update' : 'Install'}${RESET}`,
  );
  console.log('='.repeat(30));
  console.log();
}

function printStep(step: number, total: number, message: string): void {
  console.log(`${DIM}[${step}/${total}]${RESET} ${message}`);
}

function printSuccess(message: string): void {
  console.log(`${SYMBOLS.check} ${message}`);
}

function printError(message: string): void {
  console.log(`${SYMBOLS.cross} ${RED}${message}${RESET}`);
}

function printInfo(message: string): void {
  console.log(`${SYMBOLS.info} ${message}`);
}

function printWarning(message: string): void {
  console.log(`${SYMBOLS.warn} ${YELLOW}${message}${RESET}`);
}

async function checkOpenCodeInstalled(): Promise<{
  ok: boolean;
  version?: string;
  path?: string;
}> {
  const installed = await isOpenCodeInstalled();
  if (!installed) {
    printError('OpenCode is not installed on this system.');
    printInfo('Install it with:');
    console.log(
      `     ${BLUE}curl -fsSL https://opencode.ai/install | bash${RESET}`,
    );
    console.log();
    printInfo('Or if already installed, add it to your PATH:');
    console.log(`     ${BLUE}export PATH="$HOME/.local/bin:$PATH"${RESET}`);
    console.log(`     ${BLUE}export PATH="$HOME/.opencode/bin:$PATH"${RESET}`);
    return { ok: false };
  }
  const version = await getOpenCodeVersion();
  const path = getOpenCodePath();
  printSuccess(
    `OpenCode ${version ?? ''} detected${path ? ` (${DIM}${path}${RESET})` : ''}`,
  );
  return { ok: true, version: version ?? undefined, path: path ?? undefined };
}

function handleStepResult(
  result: ConfigMergeResult,
  successMsg: string,
): boolean {
  if (!result.success) {
    printError(`Failed: ${result.error}`);
    return false;
  }
  printSuccess(
    `${successMsg} ${SYMBOLS.arrow} ${DIM}${result.configPath}${RESET}`,
  );
  return true;
}

function formatConfigSummary(config: InstallConfig): string {
  const liteConfig = generateLiteConfig(config);
  const preset = (liteConfig.preset as string) || 'unknown';

  const lines: string[] = [];
  lines.push(`${BOLD}Configuration Summary${RESET}`);
  lines.push('');
  lines.push(`  ${BOLD}Preset:${RESET} ${BLUE}${preset}${RESET}`);

  const presets = liteConfig.presets as Record<string, unknown>;
  const agents = presets?.[preset] as Record<string, { model?: string }>;
  const chosenModel = agents?.orchestrator?.model;
  if (chosenModel) {
    lines.push(`  ${BOLD}Model:${RESET} ${BLUE}${chosenModel}${RESET}`);
  }

  lines.push(`  ${SYMBOLS.check} Opencode Zen`);
  lines.push(
    `  ${config.hasTmux ? SYMBOLS.check : `${DIM}○${RESET}`} Tmux Integration`,
  );
  return lines.join('\n');
}

function printAgentModels(config: InstallConfig): void {
  const liteConfig = generateLiteConfig(config);
  const presetName = (liteConfig.preset as string) || 'unknown';
  const presets = liteConfig.presets as Record<string, unknown>;
  const agents = presets?.[presetName] as Record<
    string,
    { model: string; skills: string[] }
  >;

  if (!agents || Object.keys(agents).length === 0) return;

  console.log(
    `${BOLD}Agent Configuration (Preset: ${BLUE}${presetName}${RESET}):${RESET}`,
  );
  console.log();

  const maxAgentLen = Math.max(...Object.keys(agents).map((a) => a.length));

  for (const [agent, info] of Object.entries(agents)) {
    const padding = ' '.repeat(maxAgentLen - agent.length);
    const skillsStr =
      info.skills.length > 0
        ? ` ${DIM}[${info.skills.join(', ')}]${RESET}`
        : '';
    console.log(
      `  ${DIM}${agent}${RESET}${padding} ${SYMBOLS.arrow} ${BLUE}${info.model}${RESET}${skillsStr}`,
    );
  }
  console.log();
}

function argsToConfig(args: InstallArgs): InstallConfig {
  const model = args.model?.trim() || 'opencode/big-pickle';

  const manualAgentConfigs: Record<string, ManualAgentConfig> =
    buildSingleModelManualAgentConfigs(model);

  return {
    hasKimi: false,
    hasOpenAI: false,
    hasAnthropic: false,
    hasCopilot: false,
    hasZaiPlan: false,
    hasAntigravity: false,
    hasChutes: false,
    hasOpencodeZen: true, // Always enabled - free models available to all users
    useOpenCodeFreeModels: false,
    balanceProviderUsage: false,
    hasTmux: args.tmux === 'yes',
    installSkills: args.skills === 'yes',
    installCustomSkills: args.skills === 'yes', // Install custom skills when skills=yes
    setupMode: 'manual',
    manualAgentConfigs,
    dryRun: args.dryRun,
    modelsOnly: args.modelsOnly,
  };
}

function buildSingleModelManualAgentConfigs(
  model: string,
): Record<string, ManualAgentConfig> {
  const fallback = 'opencode/big-pickle';
  const agentNames = [
    'orchestrator',
    'designer',
    'explorer',
    'librarian',
    'fixer',
  ];

  const result: Record<string, ManualAgentConfig> = {};
  for (const agentName of agentNames) {
    result[agentName] = {
      primary: model,
      fallback1: fallback,
      fallback2: fallback,
      fallback3: fallback,
    };
  }

  return result;
}

async function askYesNo(
  rl: readline.Interface,
  prompt: string,
  defaultValue: BooleanArg = 'no',
): Promise<BooleanArg> {
  const hint = defaultValue === 'yes' ? '[Y/n]' : '[y/N]';
  const answer = (await rl.question(`${BLUE}${prompt}${RESET} ${hint}: `))
    .trim()
    .toLowerCase();

  if (answer === '') return defaultValue;
  if (answer === 'y' || answer === 'yes') return 'yes';
  if (answer === 'n' || answer === 'no') return 'no';
  return defaultValue;
}

async function askModelByNumber(
  rl: readline.Interface,
  models: Array<{ model: string; name?: string }>,
  prompt: string,
  allowEmpty = false,
): Promise<string | undefined> {
  let showAll = false;

  while (true) {
    console.log(`${BOLD}${prompt}${RESET}`);
    console.log(`${DIM}Available models:${RESET}`);

    const modelsToShow = showAll ? models : models.slice(0, 5);
    const remainingCount = models.length - modelsToShow.length;

    for (const [index, model] of modelsToShow.entries()) {
      const displayIndex = showAll ? index + 1 : index + 1;
      const name = model.name ? ` ${DIM}(${model.name})${RESET}` : '';
      console.log(
        `  ${DIM}${displayIndex}.${RESET} ${BLUE}${model.model}${RESET}${name}`,
      );
    }

    if (!showAll && remainingCount > 0) {
      console.log(`${DIM}  ... and ${remainingCount} more${RESET}`);
      console.log(`${DIM}  (type "all" to show the full list)${RESET}`);
    }
    console.log(`${DIM}  (or type any model ID directly)${RESET}`);
    console.log();

    const answer = (await rl.question(`${BLUE}Selection${RESET}: `))
      .trim()
      .toLowerCase();

    if (!answer) {
      if (allowEmpty) return undefined;
      return models[0]?.model;
    }

    if (answer === 'all') {
      showAll = true;
      console.log();
      continue;
    }

    const asNumber = Number.parseInt(answer, 10);
    if (
      Number.isFinite(asNumber) &&
      asNumber >= 1 &&
      asNumber <= models.length
    ) {
      return models[asNumber - 1]?.model;
    }

    const byId = models.find((m) => m.model.toLowerCase() === answer);
    if (byId) return byId.model;

    if (answer.includes('/')) return answer;

    printWarning(
      `Invalid selection: "${answer}". Using first available model.`,
    );
    return models[0]?.model;
  }
}

async function runInteractiveMode(
  _detected: DetectedConfig,
  modelsOnly = false,
): Promise<InstallConfig> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log();
    console.log(`${BOLD}oh-our-opencodes Setup${RESET}`);
    console.log('='.repeat(25));
    console.log();

    printInfo('Loading model list with: opencode models --refresh --verbose');
    const discovery = await discoverModelCatalog();
    let chosenModel = 'opencode/big-pickle';

    if (discovery.models.length > 0) {
      const promptModels = discovery.models.map((m) => ({
        model: m.model,
        name: m.name,
      }));

      const bigPickleIndex = promptModels.findIndex(
        (m) => m.model === 'opencode/big-pickle',
      );
      if (bigPickleIndex > 0) {
        const [bigPickle] = promptModels.splice(bigPickleIndex, 1);
        if (bigPickle) promptModels.unshift(bigPickle);
      }

      chosenModel =
        (await askModelByNumber(
          rl,
          promptModels,
          'Choose a model for all agents',
        )) ?? chosenModel;
    } else {
      printWarning(
        discovery.error ??
          'No models discovered from OpenCode. Please type a model id.',
      );
      const answer = (
        await rl.question(
          `${BLUE}Model ID${RESET} ${DIM}[default: opencode/big-pickle]${RESET}: `,
        )
      ).trim();
      chosenModel = answer || chosenModel;
    }

    console.log();

    const manualAgentConfigs = buildSingleModelManualAgentConfigs(chosenModel);

    // TODO: tmux has a bug, disabled for now
    // let tmux: BooleanArg = "no"
    // if (tmuxInstalled) {
    //   console.log(`${BOLD}Question 3/3:${RESET}`)
    //   printInfo(`${BOLD}Tmux detected!${RESET} We can enable tmux integration for you.`)
    //   printInfo("This will spawn new panes for sub-agents, letting you watch them work in real-time.")
    //   tmux = await askYesNo(rl, "Enable tmux integration?", detected.hasTmux ? "yes" : "no")
    //   console.log()
    // }

    let skills: BooleanArg = 'no';
    let customSkills: BooleanArg = 'no';
    if (!modelsOnly) {
      // Skills prompt
      console.log(`${BOLD}Recommended Skills:${RESET}`);
      for (const skill of RECOMMENDED_SKILLS) {
        console.log(
          `  ${SYMBOLS.bullet} ${BOLD}${skill.name}${RESET}: ${skill.description}`,
        );
      }
      console.log();
      skills = await askYesNo(rl, 'Install recommended skills?', 'yes');
      console.log();

      // Custom skills prompt
      console.log(`${BOLD}Custom Skills:${RESET}`);
      for (const skill of CUSTOM_SKILLS) {
        console.log(
          `  ${SYMBOLS.bullet} ${BOLD}${skill.name}${RESET}: ${skill.description}`,
        );
      }
      console.log();
      customSkills = await askYesNo(rl, 'Install custom skills?', 'yes');
      console.log();
    } else {
      printInfo(
        'Models-only mode: skipping plugin/auth setup and skills prompts.',
      );
      console.log();
    }

    return {
      hasKimi: false,
      hasOpenAI: false,
      hasAnthropic: false,
      hasCopilot: false,
      hasZaiPlan: false,
      hasAntigravity: false,
      hasChutes: false,
      hasOpencodeZen: true,
      useOpenCodeFreeModels: false,
      balanceProviderUsage: false,
      hasTmux: false,
      installSkills: skills === 'yes',
      installCustomSkills: customSkills === 'yes',
      setupMode: 'manual',
      manualAgentConfigs,
      modelsOnly,
    };
  } finally {
    rl.close();
  }
}

async function runInstall(config: InstallConfig): Promise<number> {
  const resolvedConfig: InstallConfig = {
    ...config,
  };

  const detected = detectCurrentConfig();
  const isUpdate = detected.isInstalled;

  printHeader(isUpdate);

  const modelsOnly = resolvedConfig.modelsOnly === true;

  // Calculate total steps dynamically
  let totalSteps = modelsOnly ? 2 : 4; // Models-only: check + write
  if (!modelsOnly && resolvedConfig.installSkills) totalSteps += 1; // skills installation
  if (!modelsOnly && resolvedConfig.installCustomSkills) totalSteps += 1; // custom skills installation

  let step = 1;

  if (modelsOnly) {
    printInfo(
      'Models-only mode: updating model assignments without reinstalling plugins/skills.',
    );
  }

  printStep(step++, totalSteps, 'Checking OpenCode installation...');
  if (resolvedConfig.dryRun) {
    printInfo('Dry run mode - skipping OpenCode check');
  } else {
    const { ok } = await checkOpenCodeInstalled();
    if (!ok) return 1;
  }

  if (!modelsOnly) {
    printStep(step++, totalSteps, 'Adding oh-our-opencodes plugin...');
    if (resolvedConfig.dryRun) {
      printInfo('Dry run mode - skipping plugin installation');
    } else {
      const pluginResult = await addPluginToOpenCodeConfig();
      if (!handleStepResult(pluginResult, 'Plugin added')) return 1;
    }
  }

  if (!modelsOnly) {
    printStep(step++, totalSteps, 'Disabling OpenCode default agents...');
    if (resolvedConfig.dryRun) {
      printInfo('Dry run mode - skipping agent disabling');
    } else {
      const agentResult = disableDefaultAgents();
      if (!handleStepResult(agentResult, 'Default agents disabled')) return 1;
    }
  }

  printStep(step++, totalSteps, 'Writing oh-our-opencodes configuration...');
  if (resolvedConfig.dryRun) {
    const liteConfig = generateLiteConfig(resolvedConfig);
    printInfo('Dry run mode - configuration that would be written:');
    console.log(`\n${JSON.stringify(liteConfig, null, 2)}\n`);
  } else {
    const liteResult = writeLiteConfig(resolvedConfig);
    if (!handleStepResult(liteResult, 'Config written')) return 1;
  }

  // Install skills if requested
  if (!modelsOnly && resolvedConfig.installSkills) {
    printStep(step++, totalSteps, 'Installing recommended skills...');
    if (resolvedConfig.dryRun) {
      printInfo('Dry run mode - would install skills:');
      for (const skill of RECOMMENDED_SKILLS) {
        printInfo(`  - ${skill.name}`);
      }
    } else {
      let skillsInstalled = 0;
      for (const skill of RECOMMENDED_SKILLS) {
        printInfo(`Installing ${skill.name}...`);
        if (installSkill(skill)) {
          printSuccess(`Installed: ${skill.name}`);
          skillsInstalled++;
        } else {
          printWarning(`Failed to install: ${skill.name}`);
        }
      }
      printSuccess(
        `${skillsInstalled}/${RECOMMENDED_SKILLS.length} skills installed`,
      );
    }
  }

  // Install custom skills if requested
  if (!modelsOnly && resolvedConfig.installCustomSkills) {
    printStep(step++, totalSteps, 'Installing custom skills...');
    if (resolvedConfig.dryRun) {
      printInfo('Dry run mode - would install custom skills:');
      for (const skill of CUSTOM_SKILLS) {
        printInfo(`  - ${skill.name}`);
      }
    } else {
      let customSkillsInstalled = 0;
      for (const skill of CUSTOM_SKILLS) {
        printInfo(`Installing ${skill.name}...`);
        if (installCustomSkill(skill)) {
          printSuccess(`Installed: ${skill.name}`);
          customSkillsInstalled++;
        } else {
          printWarning(`Failed to install: ${skill.name}`);
        }
      }
      printSuccess(
        `${customSkillsInstalled}/${CUSTOM_SKILLS.length} custom skills installed`,
      );
    }
  }

  // Summary
  console.log();
  console.log(formatConfigSummary(resolvedConfig));
  console.log();

  printAgentModels(resolvedConfig);

  console.log(
    `${SYMBOLS.star} ${BOLD}${GREEN}${isUpdate ? 'Configuration updated!' : 'Installation complete!'}${RESET}`,
  );
  console.log();
  console.log(`${BOLD}Next steps:${RESET}`);
  console.log();

  let nextStep = 1;

  // TODO: tmux has a bug, disabled for now
  // if (config.hasTmux) {
  //   console.log(`  ${nextStep++}. Run OpenCode inside tmux:`)
  //   console.log(`     ${BLUE}$ tmux${RESET}`)
  //   console.log(`     ${BLUE}$ opencode${RESET}`)
  // } else {
  console.log(`  ${nextStep++}. Start OpenCode:`);
  console.log(`     ${BLUE}$ opencode${RESET}`);
  // }
  console.log();

  return 0;
}

export async function install(args: InstallArgs): Promise<number> {
  // Non-interactive mode: all args must be provided
  if (!args.tui) {
    const missingModel = !args.model || args.model.trim().length === 0;

    const invalidTmux =
      args.tmux !== undefined && !['yes', 'no'].includes(args.tmux);
    const invalidSkills =
      args.skills !== undefined && !['yes', 'no'].includes(args.skills);

    if (missingModel || invalidTmux || invalidSkills) {
      printHeader(false);
      printError('Missing or invalid arguments:');
      if (missingModel) {
        console.log(`  ${SYMBOLS.bullet} --model=<id>`);
      }

      if (invalidTmux) {
        console.log(`  ${SYMBOLS.bullet} --tmux=<yes|no>`);
      }

      if (invalidSkills) {
        console.log(`  ${SYMBOLS.bullet} --skills=<yes|no>`);
      }
      console.log();
      printInfo(
        'Usage: bunx oh-our-opencodes install --no-tui --model=<id> [--tmux=<yes|no>] [--skills=<yes|no>]',
      );
      console.log();
      return 1;
    }

    const nonInteractiveConfig = argsToConfig(args);
    return runInstall(nonInteractiveConfig);
  }

  // Interactive mode
  const detected = detectCurrentConfig();

  printHeader(detected.isInstalled);

  printStep(1, 1, 'Checking OpenCode installation...');
  if (args.dryRun) {
    printInfo('Dry run mode - skipping OpenCode check');
  } else {
    const { ok } = await checkOpenCodeInstalled();
    if (!ok) return 1;
  }
  console.log();

  const config = await runInteractiveMode(detected, args.modelsOnly === true);
  // Pass dryRun through to the config
  config.dryRun = args.dryRun;
  config.modelsOnly = args.modelsOnly;
  return runInstall(config);
}
