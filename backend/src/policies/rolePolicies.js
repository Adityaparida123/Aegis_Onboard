const rolePolicies = [
  {
    role: 'Software Engineer',
    department: 'Engineering',
    location: 'US',
    clearance: 'Confidential',
    software: ['GitHub', 'Slack', 'VS Code'],
    hardware: ['Laptop', 'Monitor'],
    permissions: ['Developer', 'Code Access'],
    approvalRequirements: ['GitHub Admin', 'VPN Root Access']
  },
  {
    role: 'Finance Analyst',
    department: 'Finance',
    location: 'EU',
    clearance: 'Secret',
    software: ['Payroll', 'Excel'],
    hardware: ['Laptop'],
    permissions: ['Finance Portal'],
    approvalRequirements: ['Finance Portal', 'Production Database']
  },
  {
    role: 'Accountant',
    department: 'Finance',
    location: 'US',
    clearance: 'Secret',
    software: ['Payroll', 'Excel', 'QuickBooks'],
    hardware: ['Laptop', 'Monitor'],
    permissions: ['Finance Portal', 'Ledger Access'],
    approvalRequirements: ['Finance Portal', 'Production Database']
  },
  {
    role: 'HR Manager',
    department: 'HR',
    location: 'US',
    clearance: 'Confidential',
    software: ['Workday', 'Slack', 'BambooHR'],
    hardware: ['Laptop'],
    permissions: ['HR Portal', 'Employee Records'],
    approvalRequirements: ['HR Portal']
  },
  {
    role: 'IT Administrator',
    department: 'IT',
    location: 'US',
    clearance: 'Secret',
    software: ['GitHub', 'Slack', 'Jira', 'VPN'],
    hardware: ['Laptop', 'Monitor', 'Server Access'],
    permissions: ['IT Admin Console', 'Identity Management'],
    approvalRequirements: ['AWS Administrator', 'Production Database']
  },
  {
    role: 'Security Manager',
    department: 'Security',
    location: 'US',
    clearance: 'Top Secret',
    software: ['SIEM', 'Slack', 'Vault'],
    hardware: ['Laptop', 'Monitor', 'Hardware Token'],
    permissions: ['Security Console', 'Audit Access'],
    approvalRequirements: ['VPN Root Access', 'Production Database']
  }
];

module.exports = rolePolicies;
