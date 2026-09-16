import { Project, Issue, ExportData } from '../types/issue';
import { TestCase } from '../types/testCase';

// Helper to escape CSV cell content properly
function escapeCSV(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '""';
  const str = String(text);
  // If string has double quotes, commas, or newlines, wrap in quotes and escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// Export targeted test cases to CSV
export function exportTestCasesToCSV(project: Project, testCases: TestCase[]) {
  const headers = [
    'Sr. No.',
    'Module',
    'Targeted Test Case / Feature',
    'Expected Result',
    'Status',
    'Assigned By',
    'QA Findings / Remarks',
  ];

  const sortedCases = [...testCases].sort((a, b) => a.srNo - b.srNo);

  const rows = sortedCases.map((tc) => [
    escapeCSV(tc.srNo),
    escapeCSV(tc.module || 'General'),
    escapeCSV(tc.title),
    escapeCSV(tc.expectedResult),
    escapeCSV(tc.status),
    escapeCSV(tc.assignedBy || ''),
    escapeCSV(tc.remarks || ''),
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Trigger download with UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeProjectName}_Targeted_Test_Cases_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export issues to CSV
export function exportIssuesToCSV(project: Project, issues: Issue[]) {
  const headers = [
    'Sr. No.',
    'Date',
    'Module',
    'Issue / Error',
    'Expected Result',
    'Screenshot Attached',
    'Status',
    'Severity',
    'Remarks',
  ];

  const sortedIssues = [...issues].sort((a, b) => a.srNo - b.srNo);

  const rows = sortedIssues.map((issue) => [
    escapeCSV(issue.srNo),
    escapeCSV(issue.date),
    escapeCSV(issue.module || 'General'),
    escapeCSV(issue.issue),
    escapeCSV(issue.expectedResult),
    escapeCSV(issue.screenshot ? (issue.screenshotName || 'Yes (Screenshot Attached)') : 'No'),
    escapeCSV(issue.status),
    escapeCSV(issue.severity || 'Medium'),
    escapeCSV(issue.remarks),
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Trigger download with UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeProjectName}_QA_Issues_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export full project backup (including full screenshots) to JSON
export function exportProjectToJSON(project: Project, issues: Issue[]) {
  const exportPayload: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    project,
    issues,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeProjectName}_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
