import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  openai: vi.fn(() => ({ modelId: 'gpt-6.1-sol' })),
  generateText: vi.fn(async () => ({ text: 'Updated policy text' })),
}));

vi.mock('@/utils/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('@ai-sdk/openai', () => ({ openai: mocks.openai }));
vi.mock('ai', () => ({ generateText: mocks.generateText }));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock('../../../../(app)/[orgId]/policies/[policyId]/editor/lib/policy-markdown', () => ({
  sanitizeMarkdown: (text: string) => text,
}));

import { POST } from './route';

function createRequest() {
  return new Request('http://localhost/api/policies/policy_1/edit-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionText: 'Original policy text', feedback: 'Clarify it' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ user: { id: 'user_1' } });
});

describe('policy section editing model', () => {
  it('uses GPT-6.1 Sol with medium reasoning and returns the edited text', async () => {
    const response = await POST(createRequest());

    expect(mocks.openai).toHaveBeenCalledWith('gpt-6.1-sol');
    expect(mocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { modelId: 'gpt-6.1-sol' },
        providerOptions: { openai: { reasoningEffort: 'medium' } },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updatedText: 'Updated policy text' });
  });

  it('does not call the model without an authenticated user', async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });
});
