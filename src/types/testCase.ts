export type TestCaseStatus = 'Pending' | 'Passed' | 'Failed' | 'Blocked';

export interface TestCase {
  id: string;
  projectId: string;
  srNo: number;
  module: string;
  title: string;
  expectedResult: string;
  status: TestCaseStatus;
  remarks?: string;
  assignedBy?: string;
  linkedIssueId?: string;
  createdAt: string;
  updatedAt: string;
}
