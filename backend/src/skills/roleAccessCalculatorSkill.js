const { getPoliciesSnapshot } = require('../services/policyService');

function findPolicyFor({ role, department, location, clearance }) {
  const rolePolicies = getPoliciesSnapshot();
  if (role) {
    const byRole = rolePolicies.find((policy) => policy.role === role);
    if (byRole) return byRole;
  }
  if (department) {
    const byDepartment = rolePolicies.find((policy) => policy.department === department);
    if (byDepartment) return byDepartment;
  }
  if (clearance) {
    const byClearance = rolePolicies.find((policy) => policy.clearance === clearance);
    if (byClearance) return byClearance;
  }
  if (location) {
    const byLocation = rolePolicies.find((policy) => policy.location === location);
    if (byLocation) return byLocation;
  }
  return rolePolicies[0];
}

function calculateRoleAccess(profile) {
  const match = findPolicyFor(profile);

  return {
    requiredSoftware: match.software,
    requiredHardware: match.hardware,
    permissions: match.permissions,
    approvalRequirements: match.approvalRequirements
  };
}

module.exports = { calculateRoleAccess, findPolicyFor };
