'use strict';

const path = require('path');
const crypto = require('crypto');
const dns = require('dns');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { mongoUri, nodeEnv } = require('../src/config/env');
const { verifyAuditChain } = require('../src/repositories/auditRepository');

const Employee = require('../src/models/Employee');
const Policy = require('../src/models/Policy');
const Task = require('../src/models/Task');
const Approval = require('../src/models/Approval');
const AuditLog = require('../src/models/AuditLog');
const Workflow = require('../src/models/Workflow');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');

const isProduction = nodeEnv === 'production';
const allowDestructive = process.env.AEGIS_SEED_ALLOW_DESTRUCTIVE === 'true';
const demoPassword = process.env.AEGIS_DEMO_PASSWORD || 'AegisDemo123!';

const EMPLOYEES = [
  { name: 'Ava Sharma', email: 'ava.sharma@aegis.demo', role: 'Software Engineer', department: 'Engineering', location: 'US', clearance: 'Confidential', joiningDate: '2026-08-02' },
  { name: 'Marcus Chen', email: 'marcus.chen@aegis.demo', role: 'Finance Analyst', department: 'Finance', location: 'EU', clearance: 'Secret', joiningDate: '2026-08-03' },
  { name: 'Priya Nair', email: 'priya.nair@aegis.demo', role: 'HR Manager', department: 'HR', location: 'US', clearance: 'Confidential', joiningDate: '2026-08-04' },
  { name: 'Diego Alvarez', email: 'diego.alvarez@aegis.demo', role: 'Product Manager', department: 'Product', location: 'US', clearance: 'Confidential', joiningDate: '2026-08-10' },
  { name: 'Sofia Rossi', email: 'sofia.rossi@aegis.demo', role: 'IT Administrator', department: 'IT', location: 'US', clearance: 'Secret', joiningDate: '2026-08-05' }
];

const USERS = [
  { name: 'Aegis Admin', email: 'admin@aegis.demo', role: 'Admin', department: 'Engineering' },
  { name: 'Hannah Reyes', email: 'hr@aegis.demo', role: 'HR', department: 'HR' },
  { name: 'Ivan Petrov', email: 'it@aegis.demo', role: 'IT', department: 'IT' },
  { name: 'Fiona Okafor', email: 'finance@aegis.demo', role: 'Finance', department: 'Finance' },
  { name: 'Sam Whitaker', email: 'security@aegis.demo', role: 'Security Manager', department: 'Security' }
];

const POLICIES = [
  { name: 'Software Engineer', role: 'Software Engineer', department: 'Engineering', location: 'US', clearance: 'Confidential', software: ['GitHub', 'Slack', 'VS Code'], hardware: ['Laptop', 'Monitor'], permissions: ['Developer', 'Code Access'], approvalRequirements: ['GitHub Organization Admin', 'VPN Root Access'] },
  { name: 'Product Manager', role: 'Product Manager', department: 'Product', location: 'US', clearance: 'Confidential', software: ['Jira', 'Slack', 'Figma', 'Email'], hardware: ['Laptop'], permissions: ['Product Backlog', 'Roadmap Editor'], approvalRequirements: ['Production Database', 'GitHub Organization Admin'] },
  { name: 'Finance Analyst', role: 'Finance Analyst', department: 'Finance', location: 'EU', clearance: 'Secret', software: ['Payroll Administration', 'Excel'], hardware: ['Laptop'], permissions: ['Finance Portal', 'Ledger Read'], approvalRequirements: ['Production Database', 'Payroll Administration'] },
  { name: 'HR Manager', role: 'HR Manager', department: 'HR', location: 'US', clearance: 'Confidential', software: ['HR Portal', 'Slack', 'Workday'], hardware: ['Laptop'], permissions: ['HR Portal', 'Employee Records'], approvalRequirements: [] },
  { name: 'IT Administrator', role: 'IT Administrator', department: 'IT', location: 'US', clearance: 'Secret', software: ['GitHub', 'Slack', 'Jira', 'VPN'], hardware: ['Laptop', 'Monitor', 'Server Access'], permissions: ['IT Admin Console', 'Identity Management'], approvalRequirements: ['AWS Administrator', 'Production Database', 'VPN Root Access', 'GitHub Organization Admin'] },
  { name: 'Accountant', role: 'Accountant', department: 'Finance', location: 'US', clearance: 'Secret', software: ['Payroll Administration', 'Excel', 'QuickBooks'], hardware: ['Laptop', 'Monitor'], permissions: ['Ledger Access', 'Finance Portal'], approvalRequirements: ['Payroll Administration', 'Production Database'] },
  { name: 'Security Analyst', role: 'Security Analyst', department: 'Security', location: 'US', clearance: 'Secret', software: ['SIEM', 'Slack', 'Jira'], hardware: ['Laptop'], permissions: ['Security Console'], approvalRequirements: ['VPN Root Access'] },
  { name: 'Security Manager', role: 'Security Manager', department: 'Security', location: 'US', clearance: 'Top Secret', software: ['SIEM', 'Vault', 'Slack'], hardware: ['Laptop', 'Hardware Token'], permissions: ['Security Console', 'Audit Access'], approvalRequirements: ['VPN Root Access', 'Production Database', 'AWS Administrator'] },
  { name: 'DevOps Engineer', role: 'DevOps Engineer', department: 'Engineering', location: 'US', clearance: 'Secret', software: ['GitHub', 'Jira', 'Slack', 'Docker'], hardware: ['Laptop', 'Monitor'], permissions: ['Deployment Access'], approvalRequirements: ['AWS Administrator', 'Production Database'] },
  { name: 'IT Support Specialist', role: 'IT Support Specialist', department: 'IT', location: 'US', clearance: 'Confidential', software: ['Jira', 'Slack', 'Email'], hardware: ['Laptop'], permissions: ['Ticket Queue'], approvalRequirements: ['VPN Root Access'] },
  { name: 'HR Coordinator', role: 'HR Coordinator', department: 'HR', location: 'US', clearance: 'Confidential', software: ['HR Portal', 'Slack', 'Email'], hardware: ['Laptop'], permissions: ['Candidate Records'], approvalRequirements: ['HR Portal'] },
  { name: 'Financial Controller', role: 'Financial Controller', department: 'Finance', location: 'EU', clearance: 'Top Secret', software: ['Payroll Administration', 'Excel', 'Tableau'], hardware: ['Laptop', 'Monitor'], permissions: ['Finance Portal', 'Ledger Write'], approvalRequirements: ['Payroll Administration', 'Production Database'] }
];

const CRITICAL_RESOURCES = ['Production Database', 'AWS Administrator', 'Payroll Administration', 'GitHub Organization Admin', 'VPN Root Access'];

const SCENARIOS = [
  {
    employee: EMPLOYEES[0],
    employeeStatus: 'Completed',
    workflow: {
      title: 'Onboarding for Ava Sharma',
      summary: 'Provisioning workflow for Software Engineer in Engineering',
      status: 'Completed',
      priority: 'High',
      createdAt: '2026-08-02T09:00:00.000Z',
      startedAt: '2026-08-02T09:05:00.000Z',
      completedAt: '2026-08-04T15:30:00.000Z',
      durationMinutes: 3915
    },
    tasks: [
      { title: 'Provision IT access', department: 'IT', assignedDepartment: 'IT', dependencies: [], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Provision GitHub, Slack and VS Code and Laptop, Monitor' },
      { title: 'Configure development environment', department: 'Engineering', assignedDepartment: 'IT', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Medium', estimatedDuration: 45, reason: 'Configure CI/CD pipeline and local development toolchain' },
      { title: 'Set up code repositories', department: 'Engineering', assignedDepartment: 'Engineering', dependencies: ['Configure development environment'], status: 'Completed', priority: 'Medium', estimatedDuration: 60, reason: 'Create repositories and grant Developer and Code Access permissions' },
      { title: 'Complete security awareness training', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Completed', priority: 'High', estimatedDuration: 120, reason: 'Required security baseline before accessing internal systems' },
      { title: 'Request privileged access', department: 'Security', assignedDepartment: 'Security', dependencies: ['Set up code repositories'], status: 'Completed', priority: 'High', estimatedDuration: 15, reason: 'Requires human approval for GitHub Organization Admin and VPN Root Access' },
      { title: 'Provision hardware', department: 'IT', assignedDepartment: 'IT', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Low', estimatedDuration: 30, reason: 'Ship laptop and external monitor' },
      { title: 'Complete HR orientation', department: 'HR', assignedDepartment: 'HR', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Low', estimatedDuration: 90, reason: 'Company orientation and benefits walkthrough' },
      { title: 'Final provisioning review', department: 'IT', assignedDepartment: 'Security', dependencies: ['Request privileged access', 'Complete security awareness training', 'Provision hardware', 'Complete HR orientation'], status: 'Completed', priority: 'Medium', estimatedDuration: 15, reason: 'Verify all provisioning steps completed' }
    ],
    approvals: [
      { resource: 'GitHub Organization Admin', status: 'Approved', requestedBy: 'Security Manager', reason: 'Approved GitHub Organization Admin for Ava Sharma after Security Manager review.', decision: 'approve' },
      { resource: 'VPN Root Access', status: 'Approved', requestedBy: 'Security Manager', reason: 'Approved VPN Root Access for Ava Sharma after Security Manager review.', decision: 'approve' }
    ],
    access: { software: ['GitHub', 'Slack', 'VS Code'], hardware: ['Laptop', 'Monitor'], permissions: ['Developer', 'Code Access'] },
    lowRisk: ['GitHub', 'Slack', 'VS Code'],
    taskMilestones: ['Provision IT access'],
    notifications: [
      { recipient: 'hr@aegis.demo', message: 'Workflow generated: Onboarding for Ava Sharma (Waiting Approval)', type: 'info' },
      { recipient: 'security@aegis.demo', message: 'Approval required: GitHub Organization Admin for Ava Sharma', type: 'warning' },
      { recipient: 'security@aegis.demo', message: 'Approval granted for GitHub Organization Admin', type: 'info' },
      { recipient: 'it@aegis.demo', message: 'Onboarding completed: Onboarding for Ava Sharma', type: 'success' }
    ]
  },
  {
    employee: EMPLOYEES[1],
    employeeStatus: 'Completed',
    workflow: {
      title: 'Onboarding for Marcus Chen',
      summary: 'Provisioning workflow for Finance Analyst in Finance',
      status: 'Completed',
      priority: 'High',
      createdAt: '2026-08-03T09:00:00.000Z',
      startedAt: '2026-08-03T09:05:00.000Z',
      completedAt: '2026-08-05T14:00:00.000Z',
      durationMinutes: 3145
    },
    tasks: [
      { title: 'Provision IT access', department: 'IT', assignedDepartment: 'IT', dependencies: [], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Provision Payroll Administration, Excel and Laptop' },
      { title: 'Configure finance access', department: 'Finance', assignedDepartment: 'Finance', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Medium', estimatedDuration: 20, reason: 'Enable finance portal and ledger read permissions' },
      { title: 'Enable payroll permissions', department: 'Finance', assignedDepartment: 'Finance', dependencies: ['Configure finance access'], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Grant Payroll Administration workspace access' },
      { title: 'Complete security awareness training', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Completed', priority: 'High', estimatedDuration: 120, reason: 'Required security baseline before accessing financial systems' },
      { title: 'Request privileged access', department: 'Security', assignedDepartment: 'Security', dependencies: ['Enable payroll permissions'], status: 'Completed', priority: 'High', estimatedDuration: 15, reason: 'Requires human approval for Production Database and Payroll Administration' },
      { title: 'Compliance review', department: 'Finance', assignedDepartment: 'Finance', dependencies: ['Enable payroll permissions'], status: 'Completed', priority: 'Medium', estimatedDuration: 45, reason: 'SOX audit compliance sign-off before activation' },
      { title: 'Final provisioning review', department: 'Finance', assignedDepartment: 'Security', dependencies: ['Request privileged access', 'Compliance review'], status: 'Completed', priority: 'Medium', estimatedDuration: 15, reason: 'Verify all provisioning steps completed' }
    ],
    approvals: [
      { resource: 'Production Database', status: 'Approved', requestedBy: 'Security Manager', reason: 'Approved Production Database for Marcus Chen after Security Manager review.', decision: 'approve' },
      { resource: 'Payroll Administration', status: 'Approved', requestedBy: 'Security Manager', reason: 'Approved Payroll Administration for Marcus Chen after Security Manager review.', decision: 'approve' }
    ],
    access: { software: ['Payroll Administration', 'Excel'], hardware: ['Laptop'], permissions: ['Finance Portal', 'Ledger Read'] },
    lowRisk: ['Excel'],
    taskMilestones: ['Provision IT access'],
    notifications: [
      { recipient: 'hr@aegis.demo', message: 'Workflow generated: Onboarding for Marcus Chen (Waiting Approval)', type: 'info' },
      { recipient: 'finance@aegis.demo', message: 'Compliance review completed for Marcus Chen', type: 'info' },
      { recipient: 'finance@aegis.demo', message: 'Onboarding completed: Onboarding for Marcus Chen', type: 'success' }
    ]
  },
  {
    employee: EMPLOYEES[2],
    employeeStatus: 'Completed',
    workflow: {
      title: 'Onboarding for Priya Nair',
      summary: 'Provisioning workflow for HR Manager in HR',
      status: 'Completed',
      priority: 'Medium',
      createdAt: '2026-08-04T09:00:00.000Z',
      startedAt: '2026-08-04T09:05:00.000Z',
      completedAt: '2026-08-06T10:30:00.000Z',
      durationMinutes: 2875
    },
    tasks: [
      { title: 'Provision IT access', department: 'IT', assignedDepartment: 'IT', dependencies: [], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Provision HR Portal, Slack, Workday and Laptop' },
      { title: 'Configure HR portal access', department: 'HR', assignedDepartment: 'HR', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Medium', estimatedDuration: 25, reason: 'Enable HR Portal and Employee Records permissions' },
      { title: 'Set up employee records', department: 'HR', assignedDepartment: 'HR', dependencies: ['Configure HR portal access'], status: 'Completed', priority: 'Medium', estimatedDuration: 40, reason: 'Grant Employee Records workspace access' },
      { title: 'Complete security awareness training', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Completed', priority: 'High', estimatedDuration: 120, reason: 'Required security baseline before accessing HR systems' },
      { title: 'Complete HR orientation', department: 'HR', assignedDepartment: 'HR', dependencies: ['Configure HR portal access'], status: 'Completed', priority: 'Low', estimatedDuration: 90, reason: 'Onboarding and benefits administration walkthrough' },
      { title: 'Final provisioning review', department: 'HR', assignedDepartment: 'HR', dependencies: ['Complete security awareness training', 'Complete HR orientation'], status: 'Completed', priority: 'Medium', estimatedDuration: 15, reason: 'Verify automatic provisioning completed' }
    ],
    approvals: [],
    access: { software: ['HR Portal', 'Slack', 'Workday'], hardware: ['Laptop'], permissions: ['HR Portal', 'Employee Records'] },
    lowRisk: ['HR Portal', 'Slack', 'Workday'],
    taskMilestones: ['Provision IT access', 'Configure HR portal access'],
    notifications: [
      { recipient: 'hr@aegis.demo', message: 'Workflow generated: Onboarding for Priya Nair (In Progress)', type: 'info' },
      { recipient: 'hr@aegis.demo', message: 'Onboarding completed: Onboarding for Priya Nair (automatic provisioning)', type: 'success' }
    ]
  },
  {
    employee: EMPLOYEES[3],
    employeeStatus: 'Provisioning',
    workflow: {
      title: 'Onboarding for Diego Alvarez',
      summary: 'Provisioning workflow for Product Manager in Product',
      status: 'Waiting Approval',
      priority: 'High',
      createdAt: '2026-08-07T09:00:00.000Z',
      startedAt: '2026-08-07T09:05:00.000Z',
      durationMinutes: 0
    },
    tasks: [
      { title: 'Provision IT access', department: 'IT', assignedDepartment: 'IT', dependencies: [], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Provision Jira, Slack, Figma, Email and Laptop' },
      { title: 'Set up product tools', department: 'Product', assignedDepartment: 'Product', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Medium', estimatedDuration: 40, reason: 'Install Figma, product analytics and roadmapping tools' },
      { title: 'Configure Jira board access', department: 'Product', assignedDepartment: 'Product', dependencies: ['Set up product tools'], status: 'Completed', priority: 'Medium', estimatedDuration: 25, reason: 'Add to product backlog and roadmap editor groups' },
      { title: 'Complete security awareness training', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Completed', priority: 'High', estimatedDuration: 120, reason: 'Required security baseline before accessing internal systems' },
      { title: 'Request privileged access', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Waiting Approval', priority: 'High', estimatedDuration: 15, reason: 'Requires human approval for Production Database' },
      { title: 'Final provisioning review', department: 'Security', assignedDepartment: 'Security', dependencies: ['Request privileged access'], status: 'Pending', priority: 'Medium', estimatedDuration: 15, reason: 'Blocked on pending approval gate' }
    ],
    approvals: [
      { resource: 'Production Database', status: 'Pending', requestedBy: 'Security Manager', reason: 'Production Database requires Security Manager approval because the resource is classified as critical.', decision: null },
      { resource: 'GitHub Organization Admin', status: 'Pending', requestedBy: 'Security Manager', reason: 'GitHub Organization Admin requires Security Manager approval because the resource is classified as critical.', decision: null }
    ],
    access: { software: ['Jira', 'Slack', 'Figma', 'Email'], hardware: ['Laptop'], permissions: ['Product Backlog', 'Roadmap Editor'] },
    lowRisk: ['Jira', 'Slack', 'Figma', 'Email'],
    taskMilestones: ['Provision IT access'],
    notifications: [
      { recipient: 'hr@aegis.demo', message: 'Workflow generated: Onboarding for Diego Alvarez (Waiting Approval)', type: 'info' },
      { recipient: 'security@aegis.demo', message: 'Approval pending: Production Database for Diego Alvarez', type: 'warning' },
      { recipient: 'security@aegis.demo', message: 'Approval pending: GitHub Organization Admin for Diego Alvarez', type: 'warning' }
    ]
  },
  {
    employee: EMPLOYEES[4],
    employeeStatus: 'Failed',
    workflow: {
      title: 'Onboarding for Sofia Rossi',
      summary: 'Provisioning workflow for IT Administrator in IT',
      status: 'Failed',
      priority: 'High',
      createdAt: '2026-08-05T09:00:00.000Z',
      startedAt: '2026-08-05T09:05:00.000Z',
      durationMinutes: 0
    },
    tasks: [
      { title: 'Provision IT access', department: 'IT', assignedDepartment: 'IT', dependencies: [], status: 'Completed', priority: 'High', estimatedDuration: 30, reason: 'Provision GitHub, Slack, Jira, VPN and Laptop, Monitor, Server Access' },
      { title: 'Configure server access', department: 'IT', assignedDepartment: 'IT', dependencies: ['Provision IT access'], status: 'Completed', priority: 'Medium', estimatedDuration: 60, reason: 'Configure jump host and server access groups' },
      { title: 'Set up admin console', department: 'IT', assignedDepartment: 'IT', dependencies: ['Configure server access'], status: 'Completed', priority: 'Medium', estimatedDuration: 45, reason: 'Enable IT Admin Console and Identity Management' },
      { title: 'Complete security awareness training', department: 'Security', assignedDepartment: 'Security', dependencies: ['Provision IT access'], status: 'Completed', priority: 'High', estimatedDuration: 120, reason: 'Required security baseline before accessing production systems' },
      { title: 'Request privileged access', department: 'Security', assignedDepartment: 'Security', dependencies: ['Set up admin console'], status: 'Failed', priority: 'High', estimatedDuration: 15, reason: 'AWS Administrator request rejected; requires human approval for AWS Administrator, VPN Root Access and Production Database' },
      { title: 'Compliance review', department: 'Security', assignedDepartment: 'Security', dependencies: ['Request privileged access'], status: 'Pending', priority: 'Medium', estimatedDuration: 45, reason: 'Awaiting resolution of privileged access request' },
      { title: 'Final provisioning review', department: 'Security', assignedDepartment: 'Security', dependencies: ['Request privileged access'], status: 'Pending', priority: 'Medium', estimatedDuration: 15, reason: 'Onboarding blocked by rejected high-risk request' }
    ],
    approvals: [
      { resource: 'Production Database', status: 'Approved', requestedBy: 'Security Manager', reason: 'Approved Production Database for Sofia Rossi after Security Manager review.', decision: 'approve' },
      { resource: 'AWS Administrator', status: 'Rejected', requestedBy: 'Security Manager', reason: 'Rejected AWS Administrator for Sofia Rossi: requested scope exceeds principle of least privilege; no break-glass plan submitted.', decision: 'reject' },
      { resource: 'VPN Root Access', status: 'Pending', requestedBy: 'Security Manager', reason: 'VPN Root Access requires Security Manager approval because the resource is classified as critical.', decision: null },
      { resource: 'GitHub Organization Admin', status: 'Pending', requestedBy: 'Security Manager', reason: 'GitHub Organization Admin requires Security Manager approval because the resource is classified as critical.', decision: null }
    ],
    access: { software: ['GitHub', 'Slack', 'Jira', 'VPN'], hardware: ['Laptop', 'Monitor', 'Server Access'], permissions: ['IT Admin Console', 'Identity Management'] },
    lowRisk: ['GitHub', 'Slack', 'Jira'],
    taskMilestones: ['Provision IT access'],
    notifications: [
      { recipient: 'hr@aegis.demo', message: 'Workflow generated: Onboarding for Sofia Rossi (Waiting Approval)', type: 'info' },
      { recipient: 'security@aegis.demo', message: 'Approval rejected: AWS Administrator for Sofia Rossi - onboarding blocked', type: 'warning' },
      { recipient: 'it@aegis.demo', message: 'Onboarding failed: Onboarding for Sofia Rossi', type: 'warning' }
    ]
  }
];

function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
}

function computeAuditHash(payload, prevHash) {
  return crypto.createHash('sha256').update(canonicalStringify({ ...payload, prevHash })).digest('hex');
}

function maskUri(uri) {
  try {
    const url = new URL(uri);
    if (url.username || url.password) {
      url.username = '***';
      url.password = '***';
    }
    return url.toString();
  } catch {
    return String(uri).replace(/\/\/[^@/]+@/, '//***@');
  }
}

function hoursFrom(date, hours) {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
}

function srvHostname(uri) {
  return new URL(uri.replace('mongodb+srv://', 'https://')).hostname;
}

async function ensureSrvResolution() {
  if (!mongoUri.startsWith('mongodb+srv://')) {
    return;
  }
  const hostname = srvHostname(mongoUri);
  const tryResolve = (servers) =>
    new Promise((resolve) => {
      if (servers) dns.setServers(servers);
      dns.resolveSrv(`_mongodb._tcp.${hostname}`, (error) => resolve(!error));
    });
  if (await tryResolve(null)) {
    return;
  }
  console.log('[seed] Default DNS refused SRV lookup; retrying via public resolvers.');
  await tryResolve(['8.8.8.8', '1.1.1.1']);
}

function buildAuditEvents(scenario, workflowId, employeeId) {
  const { employee, approvals, access, lowRisk, taskMilestones } = scenario;
  const criticalCount = approvals.filter((entry) => CRITICAL_RESOURCES.includes(entry.resource)).length;
  const events = [];
  let hour = -20;

  function push(action, actor, reason, input, output, result, hoursAfter) {
    hour += hoursAfter;
    events.push({ workflowId, employeeId, actor, action, reason, input, output, result, hour });
  }

  push('employee_profile_received', 'HR', `Offer letter processed for ${employee.name} via HRIS integration.`, { event: 'employee.onboarded' }, { name: employee.name, email: employee.email }, 'Received', 0);
  push('role_identified', 'OnboardingCoordinatorAgent', `Role identified: ${employee.role} in ${employee.department}.`, { role: employee.role, department: employee.department }, { role: employee.role }, 'Identified', 2);
  push('role_access_calculated', 'RoleAccessCalculator', `Calculated required access for ${employee.role}: software ${access.software.join(', ')}; hardware ${access.hardware.join(', ')}; permissions ${access.permissions.join(', ')}.`, { role: employee.role }, access, 'Calculated', 2);
  push('policy_evaluated', 'Access Policy Engine', `Evaluated ${employee.role} policy: ${lowRisk.length} low-risk resources auto-provisioned${criticalCount ? `; ${criticalCount} privileged resource${criticalCount > 1 ? 's' : ''} classified as critical and routed for approval` : '; automatic provisioning without human approval required'}.`, { policy: employee.role }, { lowRiskResources: lowRisk, highRiskResources: approvals.map((entry) => entry.resource) }, 'Evaluated', 2);

  const taskDepartments = [...new Set(scenario.tasks.map((task) => task.assignedDepartment))];
  push('tasks_generated', 'OnboardingCoordinatorAgent', `Generated ${scenario.tasks.length} onboarding tasks across ${taskDepartments.join(', ')}.`, { count: scenario.tasks.length }, { tasks: scenario.tasks.map((task) => task.title) }, 'Generated', 2);

  for (const approval of approvals) {
    if (CRITICAL_RESOURCES.includes(approval.resource)) {
      push('approval_routed', 'OnboardingCoordinatorAgent', `${approval.resource} requires Security Manager approval because the resource is classified as critical.`, { resource: approval.resource }, { riskLevel: 'critical', approverRole: 'Security Manager' }, 'Routed', 1);
    }
  }

  push('workflow_generated', 'HR', 'Offer letter processed', { employeeId: String(employeeId) }, { title: scenario.workflow.title }, 'Workflow generated', 2);

  for (const title of taskMilestones) {
    push('task_completed', scenario.tasks.find((task) => task.title === title).department, `${title} completed.`, { task: title }, { status: 'Completed' }, 'Completed', 12);
  }

  for (const approval of approvals) {
    if (approval.decision) {
      push('approval_decision', approval.requestedBy || 'Security Manager', approval.reason, { resource: approval.resource }, { status: approval.status, decision: approval.decision }, approval.decision, 10);
    }
  }

  const decided = approvals.filter((entry) => entry.decision);
  if (scenario.workflow.status === 'Completed') {
    const provisioned = [...lowRisk, ...decided.map((entry) => entry.resource)];
    push('provision_resources', 'System', `Auto-provisioned low-risk resources (${lowRisk.join(', ')}) and provisioned approved high-risk resources (${decided.map((entry) => entry.resource).join(', ')}).`, { resources: provisioned }, { outcomes: provisioned.map((resource) => ({ resource, status: 'Provisioned' })) }, 'Provisioned', 2);
    push('workflow_completed', 'System', 'All approvals granted and resources provisioned.', { resources: provisioned }, { durationMinutes: scenario.workflow.durationMinutes }, 'Completed', 2);
  } else if (scenario.workflow.status === 'Waiting Approval') {
    const pending = approvals.filter((entry) => entry.status === 'Pending').map((entry) => entry.resource);
    push('workflow_waiting_approval', 'OnboardingCoordinatorAgent', `Onboarding paused at approval gate: ${pending.join(', ')} awaiting Security Manager decision.`, { pendingResources: pending }, { status: 'Waiting Approval' }, 'Waiting', 2);
  } else if (scenario.workflow.status === 'Failed') {
    const rejected = approvals.find((entry) => entry.status === 'Rejected');
    const pending = approvals.filter((entry) => entry.status === 'Pending').map((entry) => entry.resource);
    push('workflow_failed', 'OnboardingCoordinatorAgent', `Onboarding failed: ${rejected.resource} request rejected by Security Manager; remaining pending request${pending.length > 1 ? 's' : ''} (${pending.join(', ')}) left unresolved.`, { resource: rejected.resource }, { status: 'Failed' }, 'Failed', 2);
  }

  const anchor = hoursFrom(scenario.workflow.createdAt, 9);
  return events.map(({ hour, ...event }) => ({ ...event, createdAt: hoursFrom(anchor, hour) }));
}

async function upsertEmployees() {
  const all = [];
  let created = 0;
  for (const data of EMPLOYEES) {
    const existing = await Employee.findOne({ email: data.email }).lean();
    const employee = await Employee.findOneAndUpdate(
      { email: data.email },
      { $set: { name: data.name, role: data.role, department: data.department, location: data.location, clearance: data.clearance, joiningDate: data.joiningDate } },
      { upsert: true, new: true }
    );
    if (!existing) created += 1;
    all.push(employee);
  }
  return { all, created };
}

async function upsertPolicies() {
  const docs = [];
  for (const data of POLICIES) {
    const policy = await Policy.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true }
    );
    docs.push(policy);
  }
  return docs;
}

async function upsertUsers() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const docs = [];
  for (const data of USERS) {
    const user = await User.findOneAndUpdate(
      { email: data.email },
      { $set: { name: data.name, role: data.role, department: data.department, passwordHash } },
      { upsert: true, new: true }
    );
    docs.push(user);
  }
  return docs;
}

async function refreshScenarios(employeesByEmail) {
  const seededTitles = SCENARIOS.map((scenario) => scenario.workflow.title);
  const employeeIds = employeesByEmail.map((employee) => employee._id);

  const previousWorkflows = await Workflow.find({
    employeeId: { $in: employeeIds },
    title: { $in: seededTitles }
  }).lean();
  const previousIds = previousWorkflows.map((workflow) => workflow._id);

  if (previousIds.length > 0) {
    await Task.deleteMany({ workflowId: { $in: previousIds } });
    await Approval.deleteMany({ workflowId: { $in: previousIds } });
    await AuditLog.deleteMany({ workflowId: { $in: previousIds } });
    await Workflow.deleteMany({ _id: { $in: previousIds } });
  }

  const demoEmails = [...EMPLOYEES.map((entry) => entry.email), ...USERS.map((entry) => entry.email)];
  await Notification.deleteMany({ recipient: { $in: demoEmails } });

  return previousIds.length;
}

async function seedScenarios(employeesByEmail) {
  const counts = { workflows: 0, tasks: 0, approvals: 0, auditLogs: 0, notifications: 0 };

  for (const scenario of SCENARIOS) {
    const employee = employeesByEmail.find((entry) => entry.email === scenario.employee.email);
    await Employee.updateOne({ _id: employee._id }, { status: scenario.employeeStatus });

    const workflow = await Workflow.create({
      employeeId: employee._id,
      title: scenario.workflow.title,
      summary: scenario.workflow.summary,
      status: scenario.workflow.status,
      priority: scenario.workflow.priority,
      startedAt: new Date(scenario.workflow.startedAt),
      completedAt: scenario.workflow.completedAt ? new Date(scenario.workflow.completedAt) : undefined,
      durationMinutes: scenario.workflow.durationMinutes,
      createdAt: new Date(scenario.workflow.createdAt)
    });
    counts.workflows += 1;

    const tasks = [];
    for (const task of scenario.tasks) {
      tasks.push(
        await Task.create({
          workflowId: workflow._id,
          title: task.title,
          department: task.department,
          assignedDepartment: task.assignedDepartment,
          dependencies: task.dependencies,
          status: task.status,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          reason: task.reason
        })
      );
    }
    counts.tasks += tasks.length;

    const approvals = [];
    for (const approval of scenario.approvals) {
      approvals.push(
        await Approval.create({
          workflowId: workflow._id,
          employeeId: employee._id,
          resource: approval.resource,
          status: approval.status,
          requestedBy: approval.requestedBy,
          reason: approval.reason,
          decision: approval.decision
        })
      );
    }
    counts.approvals += approvals.length;

    const events = buildAuditEvents(scenario, workflow._id, employee._id);
    let prevHash = null;
    const auditDocs = [];
    for (const event of events) {
      const { createdAt, ...payload } = event;
      const hash = computeAuditHash(payload, prevHash);
      auditDocs.push({ ...payload, createdAt, prevHash, hash });
      prevHash = hash;
    }
    await AuditLog.insertMany(auditDocs);
    counts.auditLogs += auditDocs.length;

    for (const notification of scenario.notifications) {
      await Notification.create(notification);
      counts.notifications += 1;
    }

    console.log(`  [seed] ${scenario.employee.name.padEnd(20)} workflow=${workflow.status.padEnd(16)} tasks=${tasks.length} approvals=${approvals.length} audit=${auditDocs.length}`);
  }

  return counts;
}

async function verifySeededAuditChains(employeesByEmail) {
  const results = [];
  for (const scenario of SCENARIOS) {
    const employee = employeesByEmail.find((entry) => entry.email === scenario.employee.email);
    const workflow = await Workflow.findOne({ employeeId: employee._id, title: scenario.workflow.title }).lean();
    if (!workflow) {
      results.push({ title: scenario.workflow.title, valid: false, detail: 'workflow missing' });
      continue;
    }
    const integrity = await verifyAuditChain(workflow._id);
    results.push({ title: scenario.workflow.title, valid: integrity.valid, detail: `${integrity.count} events` });
  }
  return results;
}

async function main() {
  console.log('======================================================');
  console.log('  Aegis Seed - Demo Data');
  console.log('======================================================');
  console.log(`  Target : ${maskUri(mongoUri)}`);
  console.log(`  Env    : ${nodeEnv}`);
  console.log('');

  if (isProduction && !allowDestructive) {
    await ensureSrvResolution();
    await mongoose.connect(mongoUri);
    const existing = await Employee.findOne({ email: EMPLOYEES[0].email }).lean();
    await mongoose.disconnect();
    if (existing) {
      console.log('[seed] Demo data already present and NODE_ENV=production.');
      console.log('[seed] Refusing destructive re-seed. Set AEGIS_SEED_ALLOW_DESTRUCTIVE=true to force a reset.');
      process.exitCode = 1;
      return;
    }
  }

  try {
    await ensureSrvResolution();
    await mongoose.connect(mongoUri);
    console.log('[seed] Connected to MongoDB.');
    console.log('');

    console.log('=== Employees ===');
    const { all: employees, created } = await upsertEmployees();
    console.log(`  [seed] ${created} created, ${employees.length - created} already present.`);
    console.log('');

    console.log('=== Roles / Access Policies ===');
    const policies = await upsertPolicies();
    console.log(`  [seed] ${policies.length} role-based access policies upserted.`);
    console.log('');

    console.log('=== Demo User Accounts ===');
    const users = await upsertUsers();
    console.log(`  [seed] ${users.length} demo accounts ready.`);
    console.log('');

    console.log('=== Workflows, Tasks, Approvals, Audit Logs ===');
    const refreshed = await refreshScenarios(employees);
    if (refreshed > 0) {
      console.log(`  [seed] Removed ${refreshed} previously seeded workflows (and their tasks/approvals/audit logs) to keep the demo idempotent.`);
    }
    const counts = await seedScenarios(employees);
    console.log('');

    console.log('=== Audit Chain Integrity ===');
    const integrityResults = await verifySeededAuditChains(employees);
    for (const result of integrityResults) {
      console.log(`  [seed] ${result.title.padEnd(30)} ${result.valid ? 'OK' : 'FAILED'} (${result.detail})`);
    }
    console.log('');

    console.log('=== Summary ===');
    console.log(`  [seed] Employees      : ${EMPLOYEES.length} (5 fictional hires across Engineering, Finance, HR, Product, IT)`);
    console.log(`  [seed] Policies/Roles : ${policies.length} (default + privileged access)`);
    console.log(`  [seed] Workflows      : ${counts.workflows}`);
    console.log(`  [seed] Tasks          : ${counts.tasks}`);
    console.log(`  [seed] Approvals      : ${counts.approvals}`);
    console.log(`  [seed] AuditLogs      : ${counts.auditLogs}`);
    console.log(`  [seed] Notifications  : ${counts.notifications}`);
    console.log('');
    console.log('=== Demo Login ===');
    for (const user of users) {
      console.log(`  ${user.email.padEnd(24)} / ${demoPassword}   (${user.role})`);
    }
    console.log('');

    const allValid = integrityResults.every((result) => result.valid);
    console.log(`[seed] Done. Audit chains ${allValid ? 'verified OK' : 'FAILED'}.`);
    process.exitCode = allValid ? 0 : 1;
  } catch (error) {
    console.error(`[seed] ERROR: ${error.stack || error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[seed] Disconnected from MongoDB.');
  }
}

main();
