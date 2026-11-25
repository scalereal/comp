import { ASSISTANT_OPENAI_PROVIDER_OPTIONS } from './openai-options';

describe('ASSISTANT_OPENAI_PROVIDER_OPTIONS', () => {
  it('uses medium reasoning effort for assistant chat', () => {
    expect(ASSISTANT_OPENAI_PROVIDER_OPTIONS.openai.reasoningEffort).toBe('medium');
  });

  it('disables stored Responses API item references for assistant chat', () => {
    expect(ASSISTANT_OPENAI_PROVIDER_OPTIONS.openai.store).toBe(false);
  });
});
