export type OpenCodeCommandDefinition = {
  /** Prompt template that will be sent to the LLM */
  template: string;
  /** Shown as description in TUI */
  description?: string;
  /** Optional agent override */
  agent?: string;
  /** Optional model override */
  model?: string;
  /** Force running as a subtask */
  subtask?: boolean;
};

export type OpenCodeCommandMap = Record<string, OpenCodeCommandDefinition>;
