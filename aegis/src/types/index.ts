export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  location: string;
  clearance: string;
  joiningDate?: string;
  status?: string;
}

export interface Workflow {
  _id: string;
  title: string;
  status: string;
  summary?: string;
  priority?: string;
  employeeId?: string;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  createdAt?: string;
}

export interface Task {
  _id: string;
  workflowId?: string;
  title: string;
  department: string;
  assignedDepartment: string;
  dependencies: string[];
  status: string;
  priority: string;
  estimatedDuration?: number;
  reason?: string;
}

export interface ApprovalItem {
  _id: string;
  workflowId?: string;
  employeeId?: string;
  resource: string;
  status: string;
  decision?: string;
  requestedBy?: string;
  createdAt?: string;
}

export interface AuditEvent {
  _id: string;
  actor: string;
  action: string;
  reason?: string;
  result?: string;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  message: string;
  type: string;
  read?: boolean;
  createdAt?: string;
}

export interface PolicyItem {
  _id: string;
  role: string;
  department: string;
  location: string;
  clearance: string;
  software: string[];
  hardware: string[];
  permissions: string[];
  approvalRequirements: string[];
}

export interface DashboardStats {
  pendingWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  inProgressWorkflows: number;
  averageCompletionTime: number;
  pendingApprovals: number;
  approvalRate: number;
  totalApprovals: number;
  dailyOnboardings: Record<string, number>;
  tasksByDepartment: Record<string, number>;
  workflowStatusDistribution: Record<string, number>;
}
