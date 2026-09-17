import {
  User,
  ProblemStatement,
  Startup,
  Application,
  AIMatch,
  Evaluation,
  Pilot,
  Procurement,
  Contract,
  Department,
  Notification,
  AuditLog,
  DashboardAnalytics,
  ScaleAssessment,
} from './types';

const TOKEN_KEY = 'innovprocure_auth_token';
const USER_KEY = 'innovprocure_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const str = localStorage.getItem(USER_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// 1. Auth API
export const api = {
  async login(email: string, password = 'InnovProcure@123') {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async register(userData: Partial<User> & { password?: string }) {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async getMe(): Promise<User> {
    return fetchWithAuth('/api/auth/me');
  },

  logout() {
    clearStoredAuth();
  },

  // 2. Dashboard Analytics
  async getDashboardAnalytics(filters?: { departmentId?: string; sector?: string }): Promise<DashboardAnalytics> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.sector) params.append('sector', filters.sector);
    return fetchWithAuth(`/api/analytics/dashboard?${params.toString()}`);
  },

  // 3. Problem Statements
  async getProblems(filters?: { search?: string; sector?: string; departmentId?: string; status?: string; sortBy?: string; order?: string }): Promise<{ problems: ProblemStatement[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sector) params.append('sector', filters.sector);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.order) params.append('order', filters.order);
    return fetchWithAuth(`/api/problems?${params.toString()}`);
  },

  async getProblemById(id: string): Promise<{ problem: ProblemStatement }> {
    return fetchWithAuth(`/api/problems/${id}`);
  },

  async createProblem(problemData: any): Promise<{ id: string; problemCode: string; message: string }> {
    return fetchWithAuth('/api/problems', {
      method: 'POST',
      body: JSON.stringify(problemData),
    });
  },

  async publishProblem(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/problems/${id}/publish`, { method: 'POST' });
  },

  // 4. Startups Directory
  async getStartups(filters?: { search?: string; sector?: string; technology?: string; location?: string; stage?: string }): Promise<{ startups: Startup[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sector) params.append('sector', filters.sector);
    if (filters?.technology) params.append('technology', filters.technology);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.stage) params.append('stage', filters.stage);
    return fetchWithAuth(`/api/startups?${params.toString()}`);
  },

  async getStartupById(id: string): Promise<{ startup: Startup }> {
    return fetchWithAuth(`/api/startups/${id}`);
  },

  async uploadStartupDocuments(startupId: string, files: File[]): Promise<{ message: string; documents: any[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));

    const token = getStoredToken();
    const res = await fetch(`/api/startups/${startupId}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
    }
    return data;
  },

  // 5. Applications & Screening
  async getApplications(filters?: { problemId?: string; startupId?: string; status?: string }): Promise<{ applications: Application[] }> {
    const params = new URLSearchParams();
    if (filters?.problemId) params.append('problemId', filters.problemId);
    if (filters?.startupId) params.append('startupId', filters.startupId);
    if (filters?.status) params.append('status', filters.status);
    return fetchWithAuth(`/api/applications?${params.toString()}`);
  },

  async getApplicationById(id: string): Promise<{ application: Application }> {
    return fetchWithAuth(`/api/applications/${id}`);
  },

  async submitApplication(appData: any): Promise<{ id: string; message: string }> {
    return fetchWithAuth('/api/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  async shortlistApplication(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/applications/${id}/shortlist`, { method: 'POST' });
  },

  async rejectApplication(id: string, reason?: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // 6. AI Matching Engine
  async getMatchesForProblem(problemId: string): Promise<{ matches: AIMatch[] }> {
    return fetchWithAuth(`/api/matches/problem/${problemId}`);
  },

  async generateMatches(problemId: string, limit = 8): Promise<{ matches: AIMatch[]; message: string }> {
    return fetchWithAuth('/api/matches/generate', {
      method: 'POST',
      body: JSON.stringify({ problemId, limit }),
    });
  },

  // 7. Evaluations
  async getEvaluations(applicationId?: string): Promise<{ evaluations: Evaluation[] }> {
    const url = applicationId ? `/api/evaluations?applicationId=${applicationId}` : '/api/evaluations';
    return fetchWithAuth(url);
  },

  async submitEvaluation(evaluationData: any): Promise<{ id: string; totalWeightedScore: number; message: string }> {
    return fetchWithAuth('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  },

  // 8. Pilots & KPIs
  async getPilots(filters?: { status?: string; departmentId?: string }): Promise<{ pilots: Pilot[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    return fetchWithAuth(`/api/pilots?${params.toString()}`);
  },

  async getPilotById(id: string): Promise<{ pilot: Pilot }> {
    return fetchWithAuth(`/api/pilots/${id}`);
  },

  async createPilot(pilotData: any): Promise<{ id: string; message: string }> {
    return fetchWithAuth('/api/pilots', {
      method: 'POST',
      body: JSON.stringify(pilotData),
    });
  },

  async updateKPI(kpiId: string, currentValue: number, targetValue?: number): Promise<{ message: string; status: string }> {
    return fetchWithAuth(`/api/kpis/${kpiId}`, {
      method: 'PUT',
      body: JSON.stringify({ currentValue, targetValue }),
    });
  },

  async addKPI(pilotId: string, kpiData: any): Promise<{ id: string; message: string }> {
    return fetchWithAuth(`/api/pilots/${pilotId}/kpis`, {
      method: 'POST',
      body: JSON.stringify(kpiData),
    });
  },

  // 9. Scale Assessment
  async getScaleAssessment(pilotId: string): Promise<{ assessment: ScaleAssessment }> {
    return fetchWithAuth(`/api/scale/${pilotId}`);
  },

  async submitScaleAssessment(scaleData: any): Promise<{ id: string; overallScore: number; readinessLevel: string; message: string }> {
    return fetchWithAuth('/api/scale', {
      method: 'POST',
      body: JSON.stringify(scaleData),
    });
  },

  // 10. Procurement Pipeline
  async getProcurements(filters?: { stage?: string; departmentId?: string }): Promise<{ procurements: Procurement[] }> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    return fetchWithAuth(`/api/procurement?${params.toString()}`);
  },

  async getProcurementById(id: string): Promise<{ procurement: Procurement }> {
    return fetchWithAuth(`/api/procurement/${id}`);
  },

  async createProcurement(data: any): Promise<{ id: string; message: string }> {
    return fetchWithAuth('/api/procurement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProcurementStage(id: string, toStage: string, notes?: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/procurement/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify({ toStage, notes }),
    });
  },

  // 11. Contracts
  async getContracts(): Promise<{ contracts: Contract[] }> {
    return fetchWithAuth('/api/contracts');
  },

  async createContract(data: any): Promise<{ id: string; contractNumber: string; message: string }> {
    return fetchWithAuth('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 12. Departments
  async getDepartments(): Promise<{ departments: Department[] }> {
    return fetchWithAuth('/api/departments');
  },

  async getDepartmentById(id: string): Promise<{ department: Department & { problems: ProblemStatement[]; pilots: Pilot[]; procurements: Procurement[] } }> {
    return fetchWithAuth(`/api/departments/${id}`);
  },

  // 13. Notifications
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return fetchWithAuth('/api/notifications');
  },

  async markNotificationAsRead(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return fetchWithAuth('/api/notifications/read-all', { method: 'PUT' });
  },

  // 14. Audit Logs
  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return fetchWithAuth('/api/audit-logs');
  },

  // 15. System & Demo Management
  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth('/api/system/reset-demo', { method: 'POST' });
  },
};
