import Dexie, { Table } from 'dexie';
import { Project, Issue } from '../types/issue';
import { TestCase } from '../types/testCase';

class IssueLoggerDB extends Dexie {
  projects!: Table<Project, string>;
  issues!: Table<Issue, string>;
  testCases!: Table<TestCase, string>;

  constructor() {
    super('QAIssueLoggerDB');
    this.version(1).stores({
      projects: 'id, name, prefix, createdAt',
      issues: 'id, projectId, srNo, date, status, severity, createdAt',
    });
    this.version(2).stores({
      projects: 'id, name, prefix, createdAt',
      issues: 'id, projectId, srNo, date, module, status, severity, createdAt',
    });
    this.version(3).stores({
      projects: 'id, name, prefix, createdAt',
      issues: 'id, projectId, srNo, date, module, status, severity, createdAt',
      testCases: 'id, projectId, srNo, module, status, createdAt',
    });
  }
}

export const db = new IssueLoggerDB();

// Automatically handle and recover from any schema or upgrade conflicts
db.open().catch(async (err) => {
  console.warn('Dexie DB open conflict detected, performing graceful auto-recovery:', err);
  try {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  } catch (e) {
    console.error('Database auto-recovery failed:', e);
  }
});

// Generate a lightweight SVG placeholder screenshot data URL
export function createPlaceholderScreenshot(title: string, sub: string, color = '#ef4444'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="#1e293b"/>
    <rect x="20" y="20" width="600" height="40" rx="8" fill="#334155"/>
    <circle cx="45" cy="40" r="6" fill="#ef4444"/>
    <circle cx="65" cy="40" r="6" fill="#f59e0b"/>
    <circle cx="85" cy="40" r="6" fill="#10b981"/>
    <rect x="110" y="32" width="280" height="16" rx="4" fill="#475569"/>
    
    <rect x="20" y="80" width="600" height="260" rx="8" fill="#0f172a"/>
    <rect x="60" y="110" width="520" height="50" rx="6" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5"/>
    <text x="80" y="142" fill="${color}" font-family="monospace" font-size="16" font-weight="bold">ERROR: ${title}</text>
    <text x="80" y="200" fill="#94a3b8" font-family="sans-serif" font-size="14">Observed Behavior:</text>
    <text x="80" y="225" fill="#f8fafc" font-family="sans-serif" font-size="13">${sub}</text>
    
    <text x="80" y="290" fill="#64748b" font-family="monospace" font-size="12">Captured by QA Tester | System Error Log Snapshot</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial seed data if DB is completely empty: Creates a single clean default project
export async function seedInitialDataIfNeeded() {
  const projectCount = await db.projects.count();
  if (projectCount > 0) return;

  const now = new Date().toISOString();
  const defaultProject: Project = {
    id: 'proj-' + Date.now(),
    name: 'New Project',
    prefix: 'QA',
    description: 'Workspace for software testing & QA defect tracking',
    createdAt: now,
    updatedAt: now,
  };

  await db.projects.add(defaultProject);
}

// Database helper operations
export async function getNextSrNo(projectId: string): Promise<number> {
  const issues = await db.issues.where('projectId').equals(projectId).sortBy('srNo');
  if (issues.length === 0) return 1;
  return issues[issues.length - 1].srNo + 1;
}

export async function renumberSrNos(projectId: string) {
  const issues = await db.issues.where('projectId').equals(projectId).sortBy('srNo');
  for (let i = 0; i < issues.length; i++) {
    if (issues[i].srNo !== i + 1) {
      await db.issues.update(issues[i].id, { srNo: i + 1 });
    }
  }
}

export async function getNextTestCaseSrNo(projectId: string): Promise<number> {
  const cases = await db.testCases.where('projectId').equals(projectId).sortBy('srNo');
  if (cases.length === 0) return 1;
  return cases[cases.length - 1].srNo + 1;
}
