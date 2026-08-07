const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const seedPolicies = require('../policies/rolePolicies');

let memoryPolicies = seedPolicies.map((policy, index) => ({ _id: `${index + 1}`, ...policy }));

function getPoliciesSnapshot() {
  return memoryPolicies;
}

async function listPolicies() {
  if (mongoose.connection.readyState === 1) {
    const docs = await Policy.find().lean();
    if (docs.length > 0) {
      return docs;
    }
    await Policy.insertMany(seedPolicies.map((policy) => ({ ...policy, name: policy.role })));
    return Policy.find().lean();
  }
  return memoryPolicies;
}

async function updatePolicy(policyId, patch) {
  if (mongoose.connection.readyState === 1) {
    return Policy.findByIdAndUpdate(policyId, patch, { new: true }).lean();
  }

  const index = memoryPolicies.findIndex((policy) => String(policy._id) === String(policyId));
  if (index === -1) {
    return null;
  }
  memoryPolicies[index] = { ...memoryPolicies[index], ...patch };
  return memoryPolicies[index];
}

module.exports = { getPoliciesSnapshot, listPolicies, updatePolicy };
