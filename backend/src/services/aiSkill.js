const { z } = require('zod');

const aiTaskSchema = z.object({
  title: z.string().min(2),
  department: z.string().min(2),
  dependencies: z.array(z.string()).default([]),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  estimatedDuration: z.number().int().positive().default(30),
  reason: z.string().optional()
});

const aiPlanSchema = z.object({
  title: z.string().min(2),
  summary: z.string(),
  tasks: z.array(aiTaskSchema).min(1),
  approvals: z.array(z.object({ resource: z.string().min(2) })).default([]),
  access: z
    .object({
      requiredSoftware: z.array(z.string()).default([]),
      requiredHardware: z.array(z.string()).default([]),
      permissions: z.array(z.string()).default([]),
      approvalRequirements: z.array(z.string()).default([])
    })
    .default({
      requiredSoftware: [],
      requiredHardware: [],
      permissions: [],
      approvalRequirements: []
    }),
  reasoning: z.string()
});

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function isAIConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function extractJson(text) {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function buildPrompt(profile) {
  return [
    'You are the Onboarding Coordinator. Given an employee profile, generate a JSON onboarding plan.',
    'Return ONLY valid JSON with this shape:',
    JSON.stringify({
      title: 'Onboarding for {employee name}',
      summary: 'one line summary',
      tasks: [
        {
          title: 'task name',
          department: 'IT | Finance | HR | Security | Legal | Facilities',
          dependencies: ['title of prerequisite task'],
          priority: 'Low | Medium | High',
          estimatedDuration: 30,
          reason: 'why this task is required'
        }
      ],
      approvals: [{ resource: 'sensitive resource needing human approval' }],
      access: {
        requiredSoftware: [],
        requiredHardware: [],
        permissions: [],
        approvalRequirements: []
      },
      reasoning: 'brief explanation of the plan'
    }),
    'Rules:',
    '- The first task must always provision base IT access.',
    '- Use dependencies to order tasks (a task can only list earlier tasks).',
    '- Include a privileged-access approval whenever sensitive resources are needed.',
    '- Cover every software/hardware item and permission relevant to the role.',
    'Employee profile:',
    JSON.stringify(profile, null, 2)
  ].join('\n');
}

async function generatePlanWithAI(profile, fetchImpl = globalThis.fetch) {
  if (!isAIConfigured()) {
    return null;
  }
  let response;
  try {
    response = await fetchImpl(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(profile) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return null;
    }
    const plan = aiPlanSchema.parse(extractJson(text));
    return {
      ...plan,
      tasks: plan.tasks.map((task) => ({ ...task, status: 'Pending', assignedDepartment: task.department })),
      approvals: plan.approvals.map(({ resource }) => ({ resource, status: 'Pending' }))
    };
  } catch {
    return null;
  }
}

module.exports = { generatePlanWithAI, isAIConfigured, aiPlanSchema };
