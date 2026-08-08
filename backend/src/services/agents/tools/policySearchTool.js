const { listPolicies } = require('../../policyService');

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

async function searchPolicies(query, role) {
  const policies = await listPolicies();
  const q = normalize(query);
  const roleTerm = normalize(role);

  const scored = policies
    .map((policy) => {
      const roleMatch = normalize(policy.role) === roleTerm ? 10 : 0;
      const terms = [policy.role, policy.department, ...(policy.software || []), ...(policy.permissions || []), ...(policy.approvalRequirements || [])];
      const hits = terms.filter((term) => q && normalize(term).includes(q)).length;
      return { policy, score: roleMatch + hits };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored.filter((entry) => entry.score > 0);
  if (best.length > 0) {
    return best.map((entry) => entry.policy);
  }

  return policies.filter((policy) => normalize(policy.role) === roleTerm);
}

async function findPolicyForRole(role) {
  const policies = await listPolicies();
  return policies.find((policy) => normalize(policy.role) === normalize(role)) || null;
}

module.exports = { searchPolicies, findPolicyForRole };
