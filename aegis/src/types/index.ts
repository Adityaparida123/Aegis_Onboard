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

export interface NotificationSettings {
  enabled: boolean;
  approvalReminders: boolean;
  workflowUpdates: boolean;
  completionAlerts: boolean;
  dailyDigest: boolean;
  pollIntervalSeconds: number;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeoutMinutes: number;
}

export interface AutomationSettings {
  aiAssisted: boolean;
  autoProvisionLowRisk: boolean;
}

export interface IntegrationSettings {
  email: boolean;
  slack: boolean;
  jira: boolean;
  github: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  profile: {
    timezone: string;
    locale: string;
  };
  notifications: NotificationSettings;
  security: SecuritySettings;
  automation: AutomationSettings;
  integrations: IntegrationSettings;
}

export interface ChatEscalation {
  status: string;
  department: string | null;
}

export interface ChatReply {
  answer: string;
  intent: string;
  actionRequired: boolean;
  actionTaken: string;
  escalation: ChatEscalation;
  requestId: string | null;
  sessionId: string;
}

export interface ChatMessage {
  _id: string;
  sessionId?: string;
  employeeId?: string;
  userId?: string;
  message: string;
  response: string;
  intent?: string;
  actionTaken?: string;
  actionRequired?: boolean;
  requestId?: string | null;
  escalation?: ChatEscalation;
  timestamp?: string;
}

export interface ChatSession {
  _id: string;
  employeeId?: string;
  userId?: string;
  title: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: ChatMessage[];
}

export interface SupportRequest {
  _id: string;
  employeeId?: string;
  userId?: string;
  category: string;
  subject: string;
  description: string;
  source?: string;
  status: string;
  assignedDepartment?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeContext {
  employee: Employee;
  softwareEntitled: string[];
  hardwareEntitled: string[];
  permissionsEntitled: string[];
  approvalRequirements: string[];
  onboarding: {
    title: string;
    status: string;
    pendingTasks: string[];
    completedTasks: number;
    totalTasks: number;
    approvals: string[];
  }[];
}
