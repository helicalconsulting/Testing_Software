import { Project, Issue, IssueStatus } from '../types/issue';
const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const rawBase = envUrl.replace(/\/+$/, '');
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

export interface HealthCheckResponse {
  online: boolean;
  service?: string;
  database?: string;
  timestamp?: string;
}

/**
 * Checks if the backend REST server is reachable and running
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
    return { online: false };
  } catch (err) {
    return { online: false };
  }
}

/**
 * Fetch all projects from backend
 */
export async function apiGetProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

/**
 * Create or update a project on backend
 */
export async function apiSaveProject(project: Partial<Project> & { name: string; prefix: string }): Promise<Project> {
  const isUpdate = !!project.id;
  const url = isUpdate ? `${API_BASE}/projects/${project.id}` : `${API_BASE}/projects`;
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save project');
  }
  return res.json();
}

/**
 * Delete project on backend
 */
export async function apiDeleteProject(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
  const data = await res.json();
  return !!data.success;
}

/**
 * Fetch issues by project ID
 */
export async function apiGetIssues(projectId: string): Promise<Issue[]> {
  const res = await fetch(`${API_BASE}/issues?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

/**
 * Fetch next Sr. No. for project
 */
export async function apiGetNextSrNo(projectId: string): Promise<number> {
  const res = await fetch(`${API_BASE}/issues/next-sr?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) throw new Error('Failed to fetch next sr no');
  const data = await res.json();
  return Number(data.nextSrNo) || 1;
}

/**
 * Create or update an issue
 */
export async function apiSaveIssue(issue: Partial<Issue> & { projectId: string; issue: string }): Promise<Issue> {
  const isUpdate = !!issue.id;
  const url = isUpdate ? `${API_BASE}/issues/${issue.id}` : `${API_BASE}/issues`;
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issue),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save issue');
  }
  return res.json();
}

/**
 * Delete single issue
 */
export async function apiDeleteIssue(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/issues/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete issue');
  const data = await res.json();
  return !!data.success;
}

/**
 * Bulk update issue status
 */
export async function apiBulkUpdateStatus(ids: string[], status: IssueStatus): Promise<number> {
  const res = await fetch(`${API_BASE}/issues/bulk-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error('Failed to bulk update status');
  const data = await res.json();
  return data.count || 0;
}

/**
 * Bulk delete issues
 */
export async function apiBulkDeleteIssues(ids: string[]): Promise<number> {
  const res = await fetch(`${API_BASE}/issues/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to bulk delete issues');
  const data = await res.json();
  return data.count || 0;
}

/**
 * Upload screenshot to backend disk storage
 */
export async function apiUploadScreenshot(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload screenshot to server');
  }
  return res.json();
}

/**
 * Sync local Dexie/IndexedDB datasets to backend SQLite
 */
export async function apiSyncData(projects: Project[], issues: Issue[]) {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects, issues }),
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

/**
 * Fetch test cases by project ID
 */
export async function apiGetTestCases(projectId: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/testcases?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/**
 * Save test case (create or update)
 */
export async function apiSaveTestCase(testCase: any, isUpdate: boolean = false): Promise<any> {
  const url = isUpdate && testCase.id ? `${API_BASE}/testcases/${testCase.id}` : `${API_BASE}/testcases`;
  const method = isUpdate && testCase.id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCase),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save test case');
  }
  return res.json();
}

/**
 * Delete test case
 */
export async function apiDeleteTestCase(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/testcases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete test case');
  const data = await res.json();
  return !!data.success;
}
