import React, { useState } from 'react';
import {
  Issue,
  IssueStatus,
  Project,
} from '../types/issue';
import {
  Image as ImageIcon,
  Edit2,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Archive,
  AlertCircle,
  Copy,
  Check,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';

interface IssueTableProps {
  issues: Issue[];
  project: Project;
  nextSrNo: number;
  viewMode?: 'table' | 'cards';
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issue: Issue) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
  onPreviewImage: (imageUrl: string, title: string) => void;
  onOpenNewIssueModal: () => void;
  onQuickAddIssue?: (issueData: {
    module: string;
    issue: string;
    expectedResult: string;
    status: IssueStatus;
  }) => Promise<void>;
  onBulkDelete?: (issueIds: string[]) => void;
  onBulkStatusChange?: (issueIds: string[], newStatus: IssueStatus) => void;
}

export const IssueTable: React.FC<IssueTableProps> = ({
  issues,
  project,
  nextSrNo,
  viewMode = 'table',
  onEditIssue,
  onDeleteIssue,
  onStatusChange,
  onPreviewImage,
  onOpenNewIssueModal,
  onQuickAddIssue,
  onBulkDelete,
  onBulkStatusChange,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAllSelected = issues.length > 0 && selectedIds.size === issues.length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(issues.map((i) => i.id)));
    }
  };

  const handleCopySummary = (issue: Issue) => {
    const text = `[${project.prefix || 'QA'}-${issue.srNo}] [${issue.module || 'General'}] ${issue.issue} | Expected: ${issue.expectedResult}${issue.remarks ? ` | Note: ${issue.remarks}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(issue.id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'Open':
      case 'Reopened':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'In Progress':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Resolved':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Closed':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Blocked':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'High':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Low':
        return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="relative">
      {/* CARD GRID VIEW */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">

          {/* Cards Grid */}
          {issues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No issues found for this project
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to test? Log defects above using the quick form or click "+ Log Issue" at the top.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {issues.map((issue) => {
                const isSelected = selectedIds.has(issue.id);
                return (
                  <div
                    key={issue.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Card Header: Checkbox, Sr. No., Module, Date, Severity */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(issue.id)}
                            className="text-slate-400 hover:text-blue-600 transition"
                            title={isSelected ? 'Deselect' : 'Select'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            #{issue.srNo}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                            {issue.module || 'General'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {issue.severity && (
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border tracking-wider ${getSeverityBadge(
                                issue.severity
                              )}`}
                            >
                              {issue.severity}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopySummary(issue)}
                            title="Copy issue summary"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition relative"
                          >
                            {copiedId === issue.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Issue Error Text */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2">
                        {issue.issue}
                      </h4>

                      {/* Expected Result */}
                      <div className="text-xs bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 rounded-xl p-2.5 mb-3 text-emerald-950 dark:text-emerald-300">
                        <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-0.5">
                          Expected Result:
                        </span>
                        <p className="leading-relaxed">{issue.expectedResult}</p>
                      </div>

                      {/* Screenshot Preview */}
                      {issue.screenshot && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewImage(
                                issue.screenshot!,
                                `Issue #${issue.srNo}: ${issue.issue}`
                              )
                            }
                            className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 relative group/img cursor-zoom-in block shadow-2xs"
                          >
                            <img
                              src={issue.screenshot}
                              alt="Screenshot"
                              className="w-full h-full object-cover group-hover/img:scale-105 transition duration-200"
                            />
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                              <span>↗</span>
                              <span>Enlarge</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Remarks */}
                      {issue.remarks && (
                        <div className="text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 mb-3 text-slate-600 dark:text-slate-300">
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                            Remarks / Notes:
                          </span>
                          <p className="leading-relaxed">{issue.remarks}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Date, Status Selector, Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {issue.date}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Status dropdown */}
                        <div className="relative">
                          <select
                            value={issue.status}
                            onChange={(e) =>
                              onStatusChange(issue.id, e.target.value as IssueStatus)
                            }
                            className={`appearance-none pl-2.5 pr-6 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition focus:outline-none ${getStatusBadge(
                              issue.status
                            )}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Reopened">Reopened</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>

                        {/* Edit & Delete */}
                        <button
                          type="button"
                          onClick={() => onEditIssue(issue)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteIssue(issue)}
                          title="Delete"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW (Standard QA Excel/Jira-style Table) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3.5 w-16 text-center">Sr. No.</th>
                  <th className="py-3 px-3.5 w-28 whitespace-nowrap">Date</th>
                  <th className="py-3 px-3.5 w-36 whitespace-nowrap">Module</th>
                  <th className="py-3 px-4 min-w-[280px]">Issue / Error</th>
                  <th className="py-3 px-4 min-w-[220px]">Expected Result</th>
                  <th className="py-3 px-3.5 w-24 text-center">Screenshot</th>
                  <th className="py-3 px-3.5 w-36">Status</th>
                  <th className="py-3 px-4 min-w-[180px]">Remarks</th>
                  <th className="py-3 px-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">

                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-slate-400" />
                        <span className="font-semibold text-base text-slate-700 dark:text-slate-300">
                          No issues recorded yet for this project
                        </span>
                        <span className="text-xs text-slate-400">
                          Click <strong>+ Log Issue</strong> at the top to record a defect.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => {
                    const isSelected = selectedIds.has(issue.id);
                    return (
                      <tr
                        key={issue.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center align-top">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(issue.id)}
                            className="text-slate-400 hover:text-blue-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* 1. Sr. No. */}
                        <td className="py-3.5 px-3.5 text-center align-top font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          <div className="inline-flex items-center justify-center min-w-8 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            #{issue.srNo}
                          </div>
                        </td>

                        {/* 2. Date */}
                        <td className="py-3.5 px-3.5 align-top whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-400">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {issue.date}
                          </div>
                        </td>

                        {/* 3. Module */}
                        <td className="py-3.5 px-3.5 align-top whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                            {issue.module || 'General'}
                          </span>
                        </td>

                        {/* 4. Issue / Error */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white leading-snug text-sm">
                                {issue.issue}
                              </span>
                              {issue.severity && (
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border tracking-wider ${getSeverityBadge(
                                    issue.severity
                                  )}`}
                                >
                                  {issue.severity}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 5. Expected Result */}
                        <td className="py-3.5 px-4 align-top text-xs leading-relaxed">
                          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg p-2 border border-emerald-100 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300">
                            {issue.expectedResult}
                          </div>
                        </td>

                        {/* 6. Screenshot */}
                        <td className="py-3.5 px-3.5 align-top text-center">
                          {issue.screenshot ? (
                            <div className="inline-block relative group/img">
                              <button
                                type="button"
                                onClick={() =>
                                  onPreviewImage(
                                    issue.screenshot!,
                                    `Issue #${issue.srNo}: ${issue.issue}`
                                  )
                                }
                                className="w-14 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 block hover:ring-2 hover:ring-blue-500 transition shadow-xs cursor-zoom-in"
                                title="Click to view full screenshot"
                              >
                                <img
                                  src={issue.screenshot}
                                  alt="Screenshot"
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition duration-200"
                                />
                              </button>
                              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow-xs pointer-events-none text-[8px] flex items-center justify-center w-3.5 h-3.5">
                                ↗
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEditIssue(issue)}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Attach screenshot"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Attach</span>
                            </button>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5 px-3.5 align-top">
                          <div className="relative inline-block w-full">
                            <select
                              value={issue.status}
                              onChange={(e) =>
                                onStatusChange(issue.id, e.target.value as IssueStatus)
                              }
                              className={`w-full appearance-none px-2.5 py-1.2 pr-6 rounded-lg text-xs font-semibold border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getStatusBadge(
                                issue.status
                              )}`}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                              <option value="Blocked">Blocked</option>
                              <option value="Reopened">Reopened</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* 8. Remarks */}
                        <td className="py-3.5 px-4 align-top text-xs">
                          {issue.remarks ? (
                            <div className="leading-relaxed bg-slate-50/80 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {issue.remarks}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No remarks</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopySummary(issue)}
                              title="Copy issue summary to clipboard"
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              {copiedId === issue.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => onEditIssue(issue)}
                              title="Edit Issue"
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteIssue(issue)}
                              title="Delete Issue"
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 border border-slate-700 max-w-[95vw] w-max animate-scaleIn">
          <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
            {selectedIds.size} issue{selectedIds.size > 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Bulk Mark as Resolved */}
          <button
            type="button"
            onClick={() => {
              if (onBulkStatusChange) {
                onBulkStatusChange(Array.from(selectedIds), 'Resolved');
                setSelectedIds(new Set());
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </button>

          {/* Bulk Mark as In Progress */}
          <button
            type="button"
            onClick={() => {
              if (onBulkStatusChange) {
                onBulkStatusChange(Array.from(selectedIds), 'In Progress');
                setSelectedIds(new Set());
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mark In Progress</span>
          </button>

          {/* Bulk Delete */}
          <button
            type="button"
            onClick={() => {
              if (onBulkDelete) {
                onBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Clear selection */}
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-400 hover:text-white underline ml-1"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
};
