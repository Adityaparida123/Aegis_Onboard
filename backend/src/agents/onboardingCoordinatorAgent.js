const { calculateRoleAccess, findPolicyFor } = require('../skills/roleAccessCalculatorSkill');
const { generatePlanWithAI } = require('../services/aiSkill');

function buildTasks(policy) {
  const tasks = [];

  tasks.push({
    title: 'Provision IT access',
    department: 'IT',
    assignedDepartment: 'IT',
    dependencies: [],
    status: 'Pending',
    priority: 'High',
    estimatedDuration: 30,
    reason: `Provision ${policy.software.join(', ')} and ${policy.hardware.join(', ')}`
  });

  const financeRelated =
    policy.department === 'Finance' ||
    (policy.permissions || []).some((permission) => /finance|payroll/i.test(permission)) ||
    (policy.software || []).some((software) => /payroll|finance/i.test(software));

  if (financeRelated) {
    tasks.push({
      title: 'Configure finance access',
      department: 'Finance',
      assignedDepartment: 'Finance',
      dependencies: ['Provision IT access'],
      status: 'Pending',
      priority: 'Medium',
      estimatedDuration: 20,
      reason: 'Enable finance portal and payroll permissions'
    });
  }

  if (policy.approvalRequirements && policy.approvalRequirements.length > 0) {
    tasks.push({
      title: 'Request privileged access',
      department: 'Security',
      assignedDepartment: 'Security',
      dependencies: ['Provision IT access'],
      status: 'Pending',
      priority: 'High',
      estimatedDuration: 15,
      reason: `Requires human approval for ${policy.approvalRequirements.join(', ')}`
    });
  }

  return tasks;
}

function toWorkflowShape(plan, employeeProfile) {
  const name = employeeProfile.name || 'New Employee';
  const role = employeeProfile.role || 'Employee';
  const department = employeeProfile.department || 'General';
  return {
    title: plan.title || `Onboarding for ${name}`,
    summary: plan.summary || `Provisioning workflow for ${role} in ${department}`,
    status: 'Pending',
    tasks: plan.tasks,
    approvals: plan.approvals || [],
    access: plan.access,
    reasoning: plan.reasoning || 'AI-generated onboarding plan'
  };
}

async function coordinateOnboarding(employeeProfile) {
  const aiPlan = await generatePlanWithAI(employeeProfile);
  if (aiPlan) {
    return toWorkflowShape(aiPlan, employeeProfile);
  }
  const access = calculateRoleAccess(employeeProfile);
  const policy = findPolicyFor(employeeProfile);
  const name = employeeProfile.name || 'New Employee';
  const role = employeeProfile.role || 'Employee';
  const department = employeeProfile.department || 'General';
  const workflow = {
    title: `Onboarding for ${name}`,
    summary: `Provisioning workflow for ${role} in ${department}`,
    status: 'Pending',
    tasks: buildTasks(policy),
    approvals: access.approvalRequirements.map((resource) => ({ resource, status: 'Pending' })),
    access,
    reasoning: `The coordinator selected ${access.requiredSoftware.length} software assets and ${access.requiredHardware.length} hardware assets based on the role profile, and routed ${access.approvalRequirements.length} sensitive resources for human approval.`
  };

  return workflow;
}

module.exports = { coordinateOnboarding };
