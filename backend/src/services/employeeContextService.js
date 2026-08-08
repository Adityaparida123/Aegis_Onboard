const { findEmployeeById, findEmployeeByEmail, findEmployeeByUserId } = require('../repositories/employeeRepository');
const { listWorkflows } = require('../repositories/workflowRepository');
const { listTasksByWorkflow } = require('../repositories/taskRepository');
const { listApprovalsByWorkflow } = require('../repositories/approvalRepository');
const { listPolicies } = require('./policyService');
const { AppError } = require('../utils/errors');

const ELEVATED_ROLES = ['Admin', 'HR'];

function isElevatedRole(role) {
  return ELEVATED_ROLES.includes(role);
}

async function findEmployeeForUser(user, requestedEmployeeId) {
  if (requestedEmployeeId && isElevatedRole(user?.role)) {
    const employee = await findEmployeeById(requestedEmployeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }
    return employee;
  }

  const userId = user?.sub || user?.id || user?._id;

  if (user?.employeeId) {
    const linked = await findEmployeeById(user.employeeId);
    if (linked) {
      return linked;
    }
  }

  if (userId) {
    const byUserId = await findEmployeeByUserId(userId);
    if (byUserId) {
      return byUserId;
    }
  }

  if (user?.email) {
    return findEmployeeByEmail(user.email);
  }

  return null;
}

async function gatherEmployeeContext(employee) {
  const workflows = (await listWorkflows()).filter((workflow) => workflow.employeeId?.toString() === String(employee._id));

  const workflowDetails = [];
  for (const workflow of workflows) {
    const [tasks, approvals] = await Promise.all([listTasksByWorkflow(workflow._id), listApprovalsByWorkflow(workflow._id)]);
    workflowDetails.push({
      workflowId: workflow._id,
      title: workflow.title,
      status: workflow.status,
      priority: workflow.priority,
      tasks: tasks.map((task) => ({
        title: task.title,
        status: task.status,
        department: task.assignedDepartment || task.department
      })),
      approvals: approvals.map((approval) => ({
        resource: approval.resource,
        status: approval.status,
        requestedBy: approval.requestedBy
      }))
    });
  }

  const policies = await listPolicies();
  const policy =
    policies.find((entry) => entry.role === employee.role) ||
    policies.find((entry) => entry.department === employee.department) ||
    null;

  return {
    employee: {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      location: employee.location,
      clearance: employee.clearance,
      status: employee.status,
      joiningDate: employee.joiningDate
    },
    policy: policy
      ? {
          role: policy.role,
          department: policy.department,
          software: policy.software || [],
          hardware: policy.hardware || [],
          permissions: policy.permissions || [],
          approvalRequirements: policy.approvalRequirements || []
        }
      : null,
    workflows: workflowDetails,
    computed: {
      pendingTasks: workflowDetails.flatMap((entry) => entry.tasks.filter((task) => task.status === 'Pending')),
      waitingApprovalTasks: workflowDetails.flatMap((entry) => entry.tasks.filter((task) => task.status === 'Waiting Approval')),
      pendingApprovals: workflowDetails.flatMap((entry) => entry.approvals.filter((approval) => approval.status === 'Pending')),
      totalApprovals: workflowDetails.reduce((count, entry) => count + entry.approvals.length, 0)
    }
  };
}

function serializeContext(context) {
  const { employee, policy, workflows } = context;
  return {
    employee: {
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      location: employee.location,
      status: employee.status,
      joiningDate: employee.joiningDate,
      clearance: employee.clearance
    },
    softwareEntitled: policy?.software || [],
    hardwareEntitled: policy?.hardware || [],
    permissionsEntitled: policy?.permissions || [],
    approvalRequirements: policy?.approvalRequirements || [],
    onboarding: workflows.map((workflow) => ({
      title: workflow.title,
      status: workflow.status,
      pendingTasks: workflow.tasks.filter((task) => task.status === 'Pending').map((task) => task.title),
      completedTasks: workflow.tasks.filter((task) => task.status === 'Completed').length,
      totalTasks: workflow.tasks.length,
      approvals: workflow.approvals.map((approval) => `${approval.resource} (${approval.status})`)
    }))
  };
}

module.exports = {
  findEmployeeForUser,
  gatherEmployeeContext,
  serializeContext,
  isElevatedRole
};
