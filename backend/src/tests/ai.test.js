const { generatePlanWithAI, isAIConfigured } = require('../services/aiSkill');
const { coordinateOnboarding } = require('../agents/onboardingCoordinatorAgent');

describe('AI onboarding skill', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('reports AI as not configured without a key', () => {
    delete process.env.GEMINI_API_KEY;
    expect(isAIConfigured()).toBe(false);
  });

  it('returns null when AI is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(generatePlanWithAI({ name: 'Sam' })).resolves.toBeNull();
  });

  it('parses a Gemini-style response into a validated plan', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    const fakeFetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Onboarding for Ada',
                    summary: 'Standard onboarding',
                    tasks: [
                      { title: 'Provision IT access', department: 'IT', dependencies: [], priority: 'High', estimatedDuration: 30, reason: 'base access' }
                    ],
                    approvals: [{ resource: 'AWS Admin' }],
                    access: { requiredSoftware: ['Outlook'], requiredHardware: ['Laptop'], permissions: ['login'], approvalRequirements: ['AWS Admin'] },
                    reasoning: 'Planned base access.'
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const plan = await generatePlanWithAI({ name: 'Ada', role: 'Software Engineer' }, fakeFetch);

    expect(plan).not.toBeNull();
    expect(plan.tasks[0]).toMatchObject({ title: 'Provision IT access', status: 'Pending' });
    expect(plan.approvals[0]).toMatchObject({ resource: 'AWS Admin', status: 'Pending' });
    expect(plan.access.requiredSoftware).toContain('Outlook');
  });

  it('falls back to the rule-based plan when the AI response is invalid', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    const fakeFetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json at all' }] } }] }) });

    const plan = await generatePlanWithAI({ name: 'Ada' }, fakeFetch);
    expect(plan).toBeNull();

    delete process.env.GEMINI_API_KEY;
    const workflow = await coordinateOnboarding({ name: 'Ada', role: 'Software Engineer', department: 'Engineering' });
    expect(workflow.tasks.some((task) => task.title === 'Provision IT access')).toBe(true);
    expect(workflow.approvals.length).toBeGreaterThan(0);
  });
});
