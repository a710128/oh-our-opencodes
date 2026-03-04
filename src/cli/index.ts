#!/usr/bin/env bun
import { install } from './install';
import type { BooleanArg, InstallArgs } from './types';

function parseArgs(args: string[]): InstallArgs {
  const result: InstallArgs = {
    tui: true,
  };

  for (const arg of args) {
    if (arg === '--no-tui') {
      result.tui = false;
    } else if (arg.startsWith('--model=')) {
      result.model = arg.slice('--model='.length);
    } else if (arg.startsWith('--tmux=')) {
      result.tmux = arg.split('=')[1] as BooleanArg;
    } else if (arg.startsWith('--skills=')) {
      result.skills = arg.split('=')[1] as BooleanArg;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--models-only') {
      result.modelsOnly = true;
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
oh-our-opencodes installer

Usage: bunx oh-our-opencodes install [OPTIONS]
       bunx oh-our-opencodes models [OPTIONS]

Options:
  --model=<id>           Model id to use for all agents (required with --no-tui)
  --tmux=yes|no          Enable tmux integration (yes/no)
  --skills=yes|no        Install recommended skills (yes/no)
  --no-tui               Non-interactive mode (requires --model)
  --dry-run              Simulate install without writing files or requiring OpenCode
  --models-only          Update model assignments only (skip plugin/auth/skills)
  -h, --help             Show this help message

Examples:
  bunx oh-our-opencodes install
  bunx oh-our-opencodes models
  bunx oh-our-opencodes install --no-tui --model=opencode/big-pickle --tmux=no --skills=yes
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'install' || args[0] === 'models') {
    const hasSubcommand = args[0] === 'install' || args[0] === 'models';
    const installArgs = parseArgs(args.slice(hasSubcommand ? 1 : 0));
    if (args[0] === 'models') {
      installArgs.modelsOnly = true;
    }
    const exitCode = await install(installArgs);
    process.exit(exitCode);
  } else if (args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(0);
  } else {
    console.error(`Unknown command: ${args[0]}`);
    console.error('Run with --help for usage information');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
