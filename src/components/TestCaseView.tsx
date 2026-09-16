import React, { useState, useMemo } from 'react';
import { TestCase, TestCaseStatus } from '../types/testCase';
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertOctagon,
  Edit2,
  Trash2,
  Bug,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';

interface TestCaseViewProps {
  testCases: TestCase[];
  onAddTestCase: () => void;
  onEditTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (testCase: TestCase) => void;
  onStatusChange: (id: string, newStatus: TestCaseStatus) => void;
  onRemarksChange: (id: string, remarks: string) => void;
  onConvertIssue: (testCase: TestCase) => void;
  onExportCSV?: () => void;
}

export const TestCaseView: React.FC<TestCaseViewProps> = ({
  testCases,
  onAddTestCase,
  onEditTestCase,
  onDeleteTestCase,
  onStatusChange,
  onRemarksChange,
  onConvertIssue,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TestCaseStatus>('ALL');
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [tempRemarks, setTempRemarks] = useState<string>('');

  // Metrics
  const stats = useMemo(() => {
    const total = testCases.length;
    const passed = testCases.filter((tc) => tc.status === 'Passed').length;
    const failed = testCases.filter((tc) => tc.status === 'Failed').length;
    const pending = testCases.filter((tc) => tc.status === 'Pending').length;
    const blocked = testCases.filter((tc) => tc.status === 'Blocked').length;
    return { total, passed, failed, pending, blocked };
  }, [testCases]);

  // Filtered List
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchesSearch =
        searchTerm === '' ||
        tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tc.remarks && tc.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [testCases, searchTerm, statusFilter]);

  const getStatusBadge = (status: TestCaseStatus) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200/60';
      case 'Failed':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 hover:bg-rose-200/60';
      case 'Pending':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200/60';
      case 'Blocked':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 hover:bg-purple-200/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
    }
  };

  const handleStartEditRemarks = (tc: TestCase) => {
    setEditingRemarksId(tc.id);
    setTempRemarks(tc.remarks || '');
  };

  const handleSaveRemarks = (id: string) => {
    onRemarksChange(id, tempRemarks.trim());
    setEditingRemarksId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Cases */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Targets
            </span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        {/* Pending */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/70 dark:border-amber-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {stats.pending}
          </div>
        </div>

        {/* Passed */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/70 dark:border-emerald-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Passed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.passed}
          </div>
        </div>

        {/* Failed */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-200/70 dark:border-rose-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Failed
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {stats.failed}
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR: SEARCH, FILTER, AND ADD TARGET */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search test cases, modules, findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TestCaseStatus)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses ({testCases.length})</option>
            <option value="Pending">Pending ({stats.pending})</option>
            <option value="Passed">Passed ({stats.passed})</option>
            <option value="Failed">Failed ({stats.failed})</option>
            <option value="Blocked">Blocked ({stats.blocked})</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Export CSV Button */}
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
              title="Export Targeted Test Cases to CSV (Excel format)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Add Target Test Case Button */}
          <button
            type="button"
            onClick={onAddTestCase}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Targeted Test Case</span>
          </button>
        </div>
      </div>

      {/* 3. TEST CASES TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3 px-3.5 w-16 text-center">Sr. No.</th>
                <th className="py-3 px-3.5 w-40 whitespace-nowrap">Module</th>
                <th className="py-3 px-4 min-w-[300px]">Targeted Test Case / Feature</th>
                <th className="py-3 px-4 min-w-[220px]">Expected Result</th>
                <th className="py-3 px-3.5 w-44 text-center">Status</th>
                <th className="py-3 px-4 min-w-[220px]">QA Findings</th>
                <th className="py-3 px-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span className="text-sm font-medium">
                        No targeted test cases found
                      </span>
                      <span className="text-xs text-slate-400">
                        Click <strong>Add Targeted Test Case</strong> to assign testing targets.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((tc) => (
                  <tr
                    key={tc.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Sr No */}
                    <td className="py-3.5 px-3.5 text-center align-top font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      <div className="inline-flex items-center justify-center min-w-8 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        #{tc.srNo}
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3.5 px-3.5 align-top whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                        {tc.module}
                      </span>
                      {tc.assignedBy && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          By: <span className="font-semibold">{tc.assignedBy}</span>
                        </div>
                      )}
                    </td>

                    {/* Title / Description */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white leading-snug text-sm">
                        {tc.title}
                      </div>
                    </td>

                    {/* Expected Result */}
                    <td className="py-3.5 px-4 align-top text-xs leading-relaxed">
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg p-2 border border-emerald-100 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300">
                        {tc.expectedResult}
                      </div>
                    </td>

                    {/* Status Dropdown / Check-in */}
                    <td className="py-3.5 px-3.5 align-top">
                      <div className="relative inline-block w-full min-w-[140px]">
                        <select
                          value={tc.status}
                          onChange={(e) =>
                            onStatusChange(tc.id, e.target.value as TestCaseStatus)
                          }
                          className={`w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 cursor-pointer transition-all shadow-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getStatusBadge(
                            tc.status
                          )}`}
                        >
                          <option value="Pending">🟡 Pending</option>
                          <option value="Passed">🟢 Passed</option>
                          <option value="Failed">🔴 Failed</option>
                          <option value="Blocked">🟣 Blocked</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                      </div>
                    </td>

                    {/* QA Findings / Remarks */}
                    <td className="py-3.5 px-4 align-top text-xs">
                      {editingRemarksId === tc.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            rows={2}
                            value={tempRemarks}
                            onChange={(e) => setTempRemarks(e.target.value)}
                            placeholder="Type findings / error details..."
                            className="w-full p-2 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveRemarks(tc.id)}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRemarksId(null)}
                              className="px-2 py-1 text-slate-500 rounded-md text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditRemarks(tc)}
                          className="cursor-pointer group/rem p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 min-h-[36px]"
                          title="Click to edit findings / remarks"
                        >
                          {tc.remarks ? (
                            <div className="leading-relaxed bg-slate-50/80 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {tc.remarks}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs group-hover/rem:text-blue-500">
                              Add findings / error notes
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        {/* Convert to Issue (if failed or has findings) */}
                        {tc.status === 'Failed' && (
                          <button
                            type="button"
                            onClick={() => onConvertIssue(tc)}
                            title="Log this failure as an Issue in Defect Tracker"
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          >
                            <Bug className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditTestCase(tc)}
                          title="Edit Target Case"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTestCase(tc)}
                          title="Delete Target Case"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
