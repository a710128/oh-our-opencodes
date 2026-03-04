/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { createPhaseReminderHook } from './index';

describe('phase-reminder hook', () => {
  test('prepends timestamped reminder for orchestrator', async () => {
    const hook = createPhaseReminderHook();
    const output = {
      messages: [
        {
          info: { role: 'assistant' },
          parts: [{ type: 'text', text: 'previous reply' }],
        },
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: 'hello' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({} as never, output);

    const text = output.messages[1].parts[0].text;
    expect(text).toBeDefined();
    expect(text).toContain('Recall Workflow Rules:');
    expect(text).toContain('\n\n---\n\nhello');
    expect(text).toMatch(
      /^<reminder>\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]Recall Workflow Rules:/,
    );
  });

  test('does not inject for non-orchestrator agents', async () => {
    const hook = createPhaseReminderHook();
    const output = {
      messages: [
        {
          info: { role: 'user', agent: 'explorer' },
          parts: [{ type: 'text', text: 'hello' }],
        },
      ],
    };

    await hook['experimental.chat.messages.transform']({} as never, output);

    expect(output.messages[0].parts[0].text).toBe('hello');
  });
});
