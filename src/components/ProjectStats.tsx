import React from 'react';
import { Issue, IssueStatus } from '../types/issue';
import { Bug, Clock, CheckCircle2, AlertOctagon, Archive, ShieldAlert } from 'lucide-react';

interface ProjectStatsProps {
  issues: Issue[];
  currentStatusFilter: string;
  onFilterByStatus: (status: string) => void;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({
  issues,
  currentStatusFilter,
  onFilterByStatus,
}) => {
  const total = issues.length;
  const openCount = issues.filter((i) => i.status === 'Open' || i.status === 'Reopened').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const closedCount = issues.filter((i) => i.status === 'Closed').length;
  const blockedCount = issues.filter((i) => i.status === 'Blocked').length;
  const criticalCount = issues.filter((i) => i.severity === 'Critical').length;

  const stats = [
    {
      label: 'Total Issues',
      count: total,
      statusKey: 'ALL',
      icon: Bug,
      color: 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
      activeColor: 'ring-2 ring-slate-800 dark:ring-blue-400 bg-slate-200/80 dark:bg-slate-800',
    },
    {
      label: 'Open / Reopened',
      count: openCount,
      statusKey: 'Open',
      icon: Clock,
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      activeColor: 'ring-2 ring-amber-600 dark:ring-amber-400 bg-amber-100/80 dark:bg-amber-950/60',
    },
    {
      label: 'In Progress',
      count: inProgressCount,
      statusKey: 'In Progress',
      icon: Clock,
      color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
      activeColor: 'ring-2 ring-blue-600 dark:ring-blue-400 bg-blue-100/80 dark:bg-blue-950/60',
    },
    {
      label: 'Resolved',
      count: resolvedCount,
      statusKey: 'Resolved',
      icon: CheckCircle2,
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
      activeColor: 'ring-2 ring-emerald-600 dark:ring-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60',
    },
    {
      label: 'Blocked',
      count: blockedCount,
      statusKey: 'Blocked',
      icon: AlertOctagon,
      color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
      activeColor: 'ring-2 ring-rose-600 dark:ring-rose-400 bg-rose-100/80 dark:bg-rose-950/60',
    },
    {
      label: 'Closed',
      count: closedCount,
      statusKey: 'Closed',
      icon: Archive,
      color: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
      activeColor: 'ring-2 ring-slate-600 dark:ring-slate-400 bg-slate-200/80 dark:bg-slate-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = currentStatusFilter === stat.statusKey;
        return (
          <button
            key={stat.label}
            onClick={() => onFilterByStatus(stat.statusKey)}
            className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer active:scale-98 shadow-xs ${
              stat.color
            } ${isActive ? stat.activeColor : 'opacity-85 hover:opacity-100 hover:shadow-xs'}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                {stat.label}
              </span>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-60 shrink-0" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {stat.count}
              </span>
              {stat.label === 'Total Issues' && criticalCount > 0 && (
                <span className="text-xs font-bold text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <ShieldAlert className="w-3 h-3" />
                  {criticalCount} Crit
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
