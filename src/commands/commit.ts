import type { OpenCodeCommandDefinition } from './types';

export const commitCommand: OpenCodeCommandDefinition = {
  description: 'Stage changes and create a git commit',
  template: `Write the commit message for the changes in the current working directory, and commit the changes using "git commit". If you are not sure which files should be committed, just ask me.`,
};
