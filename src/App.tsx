import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from './db/database';
import { Project, Issue, IssueStatus, FilterOptions, ExportData } from './types/issue';
import { Header } from './components/Header';
import { ProjectStats } from './components/ProjectStats';
import { FilterBar } from './components/FilterBar';
import { IssueTable } from './components/IssueTable';
import { IssueModal } from './components/IssueModal';
import { ProjectModal } from './components/ProjectModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ImageLightbox } from './components/ImageLightbox';
import { CloudinaryModal } from './components/CloudinaryModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { isCloudinaryConfigured } from './services/cloudinary';
import {
  playSuccessSound,
  playDeleteSound,
  isAudioEnabled,
  toggleAudioEnabled,
} from './utils/audio';
import {
  checkBackendHealth,
  apiGetProjects,
  apiGetIssues,
  apiSaveProject,
  apiDeleteProject,
  apiSaveIssue,
  apiDeleteIssue,
  apiBulkUpdateStatus,
  apiBulkDeleteIssues,
  apiSyncData,
} from './services/api';
import { Sparkles, CheckCircle2, Keyboard, Database, Edit3, Trash2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('qa_active_project_id') || '';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Theme state (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('qa_theme');
    if (saved) return saved === 'dark';
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Sound effects state
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => isAudioEnabled());

  // View mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    return (localStorage.getItem('qa_view_mode') as 'table' | 'cards') || 'table';
  });

  // Shortcuts modal state
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Search input ref for keyboard shortcut /
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    module: 'ALL',
    status: 'ALL',
    severity: 'ALL',
    startDate: '',
    endDate: '',
    sortBy: 'srNo',
    sortOrder: 'asc',
  });

  // Modal states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    title?: string;
  }>({
    isOpen: false,
  });

  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);
  const [cloudinaryActive, setCloudinaryActive] = useState<boolean>(() =>
    isCloudinaryConfigured()
  );

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('qa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('qa_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('qa_view_mode', viewMode);
  }, [viewMode]);

  // Seed DB on startup & connect to backend REST API
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // Purge any legacy localStorage pointers to mock projects
      const storedActiveId = localStorage.getItem('qa_active_project_id');
      if (storedActiveId === 'proj-ecommerce' || storedActiveId === 'proj-fintech') {
        localStorage.removeItem('qa_active_project_id');
      }
      try {
        await db.projects.where('id').anyOf(['proj-ecommerce', 'proj-fintech']).delete();
        await db.issues.where('projectId').anyOf(['proj-ecommerce', 'proj-fintech']).delete();
      } catch (e) {
        // Ignore if dexie query fails
      }

      // 1. Check backend REST API status
      const health = await checkBackendHealth();
      const online = !!health.online;
      if (isMounted) setIsBackendOnline(online);

      if (online) {
        try {
          const beProjects = await apiGetProjects();
          // Always clear local Dexie cache when online to guarantee zero mock data residue
          await db.projects.clear();
          await db.issues.clear();

          if (beProjects && beProjects.length > 0) {
            for (const p of beProjects) {
              await db.projects.put(p);
              try {
                const beIssues = await apiGetIssues(p.id);
                if (beIssues && beIssues.length > 0) {
                  await db.issues.bulkPut(beIssues);
                }
              } catch (err) {
                console.warn(`Failed to fetch issues for project ${p.id}:`, err);
              }
            }
          } else {
            // DB is completely fresh & empty: create 1 clean default project directly on backend DB
            const created = await apiSaveProject({
              name: 'New Project',
              prefix: 'QA',
              description: 'Workspace for software testing & QA defect tracking',
            });
            await db.projects.put(created);
          }
        } catch (err) {
          console.warn('Initial backend fetch error:', err);
          await seedInitialDataIfNeeded();
        }
      } else {
        await seedInitialDataIfNeeded();
      }

      const allProjects = await db.projects.toArray();
      if (allProjects.length > 0 && isMounted) {
        if (!allProjects.some((p) => p.id === activeProjectId)) {
          setActiveProjectId(allProjects[0].id);
        }
      }
    }

    init();

    // Heartbeat check every 15s to monitor backend status
    const interval = setInterval(async () => {
      const h = await checkBackendHealth();
      if (isMounted) setIsBackendOnline(!!h.online);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Save selected project to localStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('qa_active_project_id', activeProjectId);
    }
  }, [activeProjectId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Close open modal on Escape
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
      }

      // '/' or 'Ctrl+K' focuses Search bar
      if (
        (e.key === '/' && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // 'Ctrl+N' opens New Issue Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingIssue(null);
        setIsIssueModalOpen(true);
        return;
      }

      // Shortcuts when NOT typing inside an input/textarea
      if (!isInput) {
        if (e.key === '?') {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'));
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setIsDarkMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen]);

  // Live queries for reactive UI
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const rawIssues =
    useLiveQuery<Issue[]>(
      () =>
        activeProjectId
          ? db.issues.where('projectId').equals(activeProjectId).toArray()
          : Promise.resolve<Issue[]>([]),
      [activeProjectId]
    ) || [];

  // Active project object
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Next Sr No calculation
  const nextSrNo = useMemo(() => {
    if (rawIssues.length === 0) return 1;
    return Math.max(...rawIssues.map((i) => i.srNo)) + 1;
  }, [rawIssues]);

  // Available unique modules for filter dropdown
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    rawIssues.forEach((i) => {
      if (i.module?.trim()) set.add(i.module.trim());
    });
    return Array.from(set).sort();
  }, [rawIssues]);

  // Filtered and sorted issues
  const filteredIssues = useMemo(() => {
    return rawIssues
      .filter((issue) => {
        // Module filter
        if (filters.module && filters.module !== 'ALL') {
          if (issue.module !== filters.module) return false;
        }
        // Status filter
        if (filters.status !== 'ALL') {
          if (filters.status === 'Open') {
            if (issue.status !== 'Open' && issue.status !== 'Reopened') return false;
          } else if (issue.status !== filters.status) {
            return false;
          }
        }
        // Severity filter
        if (filters.severity !== 'ALL' && issue.severity !== filters.severity) {
          return false;
        }
        // Search filter (Module, Issue, expectedResult, remarks, date)
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const matchModule = (issue.module || '').toLowerCase().includes(q);
          const matchIssue = issue.issue.toLowerCase().includes(q);
          const matchExpected = issue.expectedResult.toLowerCase().includes(q);
          const matchRemarks = (issue.remarks || '').toLowerCase().includes(q);
          const matchSr = `#${issue.srNo}`.includes(q) || String(issue.srNo).includes(q);
          if (!matchModule && !matchIssue && !matchExpected && !matchRemarks && !matchSr)
            return false;
        }
        return true;
      })
      .sort((a, b) => a.srNo - b.srNo);
  }, [rawIssues, filters]);

  // Handlers for Issue CRUD
  const handleSaveIssue = async (
    issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    const effectiveProjectId =
      issueData.projectId || activeProjectId || projects[0]?.id || '';

    // Ensure project exists in DB so issues are never orphaned
    const projExists = await db.projects.get(effectiveProjectId);
    if (!projExists) {
      await db.projects.put({
        id: effectiveProjectId,
        name: activeProject?.name || 'Default Test Project',
        prefix: activeProject?.prefix || 'QA',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Determine safe sequential Sr. No.
    let safeSrNo = issueData.srNo;
    if (!safeSrNo || safeSrNo < 1) {
      const existing = await db.issues
        .where('projectId')
        .equals(effectiveProjectId)
        .toArray();
      safeSrNo =
        existing.length > 0 ? Math.max(...existing.map((i) => i.srNo)) + 1 : 1;
    }

    const safeData: Issue = {
      id: editingIssue
        ? editingIssue.id
        : `issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId: effectiveProjectId,
      srNo: safeSrNo,
      date: issueData.date || now.split('T')[0],
      module: issueData.module?.trim() || 'General',
      issue: issueData.issue.trim(),
      expectedResult:
        issueData.expectedResult?.trim() ||
        'Expected to function properly without error',
      screenshot: issueData.screenshot,
      screenshotName: issueData.screenshotName,
      status: issueData.status || 'Open',
      severity: issueData.severity || 'Medium',
      remarks: issueData.remarks?.trim() || '',
      createdAt: editingIssue ? editingIssue.createdAt : now,
      updatedAt: now,
    };

    // Use put (upsert) to prevent any constraint collision
    await db.issues.put(safeData);

    // Dual-write to SQLite backend if online
    if (isBackendOnline) {
      apiSaveIssue(safeData).catch((err) => {
        console.warn('Backend issue sync failed:', err);
      });
    }

    if (activeProjectId !== effectiveProjectId) {
      setActiveProjectId(effectiveProjectId);
    }

    // Pleasant audio feedback
    playSuccessSound();

    setToastMessage(
      editingIssue
        ? `Issue #${safeSrNo} updated successfully!`
        : `Issue #${safeSrNo} logged successfully!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuickAddIssue = async (data: {
    module: string;
    issue: string;
    expectedResult: string;
    status: IssueStatus;
  }) => {
    await handleSaveIssue({
      projectId: activeProjectId,
      srNo: nextSrNo,
      date: new Date().toISOString().split('T')[0],
      module: data.module,
      issue: data.issue,
      expectedResult: data.expectedResult,
      status: data.status,
      severity: 'Medium',
      remarks: '',
    });
  };

  const handleInlineStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    const now = new Date().toISOString();
    await db.issues.update(issueId, {
      status: newStatus,
      updatedAt: now,
    });
    if (isBackendOnline) {
      const issueObj = rawIssues.find((i) => i.id === issueId);
      if (issueObj) {
        apiSaveIssue({ ...issueObj, status: newStatus, updatedAt: now }).catch(() => {});
      }
    }
    if (newStatus === 'Resolved') {
      playSuccessSound();
    }
  };

  const handleDeleteIssueClick = (issue: Issue) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Issue #${issue.srNo}?`,
      message: `Are you sure you want to delete this issue? This action cannot be undone.`,
      onConfirm: async () => {
        await db.issues.delete(issue.id);
        if (isBackendOnline) {
          apiDeleteIssue(issue.id).catch((err) => console.warn('Backend delete issue failed:', err));
        }
        playDeleteSound();
        setToastMessage(`Issue #${issue.srNo} deleted`);
        setTimeout(() => setToastMessage(null), 3000);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Bulk actions handlers
  const handleBulkDelete = (ids: string[]) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${ids.length} selected issue${ids.length > 1 ? 's' : ''}?`,
      message: `Are you sure you want to permanently delete these ${ids.length} defects? This action cannot be undone.`,
      onConfirm: async () => {
        await db.issues.bulkDelete(ids);
        if (isBackendOnline) {
          apiBulkDeleteIssues(ids).catch((err) => console.warn('Backend bulk delete failed:', err));
        }
        playDeleteSound();
        setToastMessage(`Successfully deleted ${ids.length} issues`);
        setTimeout(() => setToastMessage(null), 3500);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkStatusChange = async (ids: string[], status: IssueStatus) => {
    const now = new Date().toISOString();
    await Promise.all(
      ids.map((id) => db.issues.update(id, { status, updatedAt: now }))
    );
    if (isBackendOnline) {
      apiBulkUpdateStatus(ids, status).catch((err) => console.warn('Backend bulk status failed:', err));
    }
    if (status === 'Resolved') {
      playSuccessSound();
    }
    setToastMessage(`Marked ${ids.length} issue${ids.length > 1 ? 's' : ''} as "${status}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers for Project CRUD
  const handleSaveProject = async (data: {
    name: string;
    prefix: string;
    description?: string;
  }) => {
    const now = new Date().toISOString();
    if (editingProject) {
      const updated: Project = {
        ...editingProject,
        ...data,
        updatedAt: now,
      };
      await db.projects.update(editingProject.id, updated);
      if (isBackendOnline) {
        apiSaveProject(updated).catch((err) => console.warn('Backend save project failed:', err));
      }
    } else {
      const newProjectId = `proj-${Date.now()}`;
      const newProj: Project = {
        id: newProjectId,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await db.projects.add(newProj);
      if (isBackendOnline) {
        apiSaveProject(newProj).catch((err) => console.warn('Backend create project failed:', err));
      }
      setActiveProjectId(newProjectId);
    }
  };

  const handleDeleteProjectClick = () => {
    if (!activeProject) return;
    const isLastProject = projects.length <= 1;
    setConfirmModal({
      isOpen: true,
      title: `Delete Project "${activeProject.name}"?`,
      message: isLastProject
        ? `Are you sure you want to delete this project and all its ${rawIssues.length} logged issues? Since this is the only remaining project, a clean fresh workspace will be created.`
        : `Are you sure you want to delete this project and all its ${rawIssues.length} logged issues? This action cannot be reversed.`,
      onConfirm: async () => {
        await db.issues.where('projectId').equals(activeProject.id).delete();
        await db.projects.delete(activeProject.id);
        if (isBackendOnline) {
          apiDeleteProject(activeProject.id).catch((err) => console.warn('Backend delete project failed:', err));
        }
        playDeleteSound();
        const remaining = await db.projects.toArray();
        if (remaining.length > 0) {
          setActiveProjectId(remaining[0].id);
        } else {
          // All projects deleted - auto-generate a fresh empty project so app stays functional
          const newProjectId = `proj-${Date.now()}`;
          const now = new Date().toISOString();
          const defaultProj: Project = {
            id: newProjectId,
            name: 'New Project',
            prefix: 'QA',
            description: 'Default project created after deleting all projects',
            createdAt: now,
            updatedAt: now,
          };
          await db.projects.add(defaultProj);
          if (isBackendOnline) {
            apiSaveProject(defaultProj).catch((err) => console.warn('Backend save project failed:', err));
          }
          setActiveProjectId(newProjectId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Import JSON handler
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed: ExportData = JSON.parse(content);
        if (!parsed.project || !Array.isArray(parsed.issues)) {
          alert('Invalid backup file format. Expected a project and issues array.');
          return;
        }

        const project = parsed.project;
        // Check if project exists or generate new ID
        const existing = await db.projects.get(project.id);
        const targetProjectId = existing ? `proj-imported-${Date.now()}` : project.id;
        const finalProject: Project = {
          ...project,
          id: targetProjectId,
          name: existing ? `${project.name} (Imported)` : project.name,
        };

        await db.projects.put(finalProject);

        // Put all issues
        const issuesToInsert: Issue[] = parsed.issues.map((i) => ({
          ...i,
          projectId: targetProjectId,
        }));
        await db.issues.bulkPut(issuesToInsert);

        setActiveProjectId(targetProjectId);
        playSuccessSound();
        alert(
          `Successfully imported project "${finalProject.name}" with ${issuesToInsert.length} issues!`
        );
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Header
        projects={projects}
        activeProject={activeProject}
        issues={rawIssues}
        onSelectProject={(id) => setActiveProjectId(id)}
        onOpenNewProjectModal={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onOpenEditProjectModal={() => {
          if (activeProject) {
            setEditingProject(activeProject);
            setIsProjectModalOpen(true);
          }
        }}
        onDeleteProject={handleDeleteProjectClick}
        onOpenNewIssueModal={() => {
          setEditingIssue(null);
          setIsIssueModalOpen(true);
        }}
        onImportJSON={handleImportJSON}
        onOpenCloudinaryModal={() => setIsCloudinaryModalOpen(true)}
        isCloudinaryActive={cloudinaryActive}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(toggleAudioEnabled())}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        isBackendOnline={isBackendOnline}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Project Title and Overview */}
        {activeProject && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeProject.name}
                </h1>
                <span className="px-2.5 py-0.5 text-xs sm:text-sm font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                  {activeProject.prefix}
                </span>

                {/* Visible Edit & Delete Project Action Buttons */}
                <div className="flex items-center gap-1.5 xs:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(activeProject);
                      setIsProjectModalOpen(true);
                    }}
                    title="Edit project settings"
                    className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteProjectClick}
                    title="Delete this project"
                    className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Delete Project</span>
                  </button>
                </div>
              </div>
              {activeProject.description && (
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                  {activeProject.description}
                </p>
              )}
            </div>


          </div>
        )}

        {/* Project Status Stats Bar */}
        <ProjectStats
          issues={rawIssues}
          currentStatusFilter={filters.status}
          onFilterByStatus={(statusKey) =>
            setFilters((prev) => ({ ...prev, status: statusKey }))
          }
        />

        {/* Search, Filter, View Mode, and Action Controls */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() =>
            setFilters({
              search: '',
              module: 'ALL',
              status: 'ALL',
              severity: 'ALL',
              startDate: '',
              endDate: '',
              sortBy: 'srNo',
              sortOrder: 'asc',
            })
          }
          onOpenNewIssueModal={() => {
            setEditingIssue(null);
            setIsIssueModalOpen(true);
          }}
          filteredCount={filteredIssues.length}
          totalCount={rawIssues.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableModules={availableModules}
          searchInputRef={searchInputRef}
        />

        {/* Issue Data Table / Responsive Card Grid */}
        {activeProject && (
          <IssueTable
            issues={filteredIssues}
            project={activeProject}
            nextSrNo={nextSrNo}
            viewMode={viewMode}
            onEditIssue={(issue) => {
              setEditingIssue(issue);
              setIsIssueModalOpen(true);
            }}
            onDeleteIssue={handleDeleteIssueClick}
            onStatusChange={handleInlineStatusChange}
            onPreviewImage={(url, title) =>
              setLightbox({ isOpen: true, imageUrl: url, title })
            }
            onOpenNewIssueModal={() => {
              setEditingIssue(null);
              setIsIssueModalOpen(true);
            }}
            onQuickAddIssue={handleQuickAddIssue}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 mt-8 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Product Owner:</span>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
              <img
                src="/Procnex-logo.jpeg"
                alt="Helical Consulting Logo"
                className="h-5 sm:h-6 w-auto object-contain rounded"
              />
              <span className="font-bold text-slate-900 dark:text-white">Helical Consulting</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>QA Issue Logger</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hover:text-blue-500 transition flex items-center gap-1"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts (<kbd className="font-mono">?</kbd>)</span>
            </button>
            <span>•</span>
            <span>
              💡 Tip: Press <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">Ctrl+V</kbd> to paste screenshots
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <IssueModal
        isOpen={isIssueModalOpen}
        projectId={activeProjectId}
        nextSrNo={nextSrNo}
        initialIssue={editingIssue}
        onClose={() => {
          setIsIssueModalOpen(false);
          setEditingIssue(null);
        }}
        onSave={handleSaveIssue}
        onOpenCloudinarySettings={() => setIsCloudinaryModalOpen(true)}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        initialProject={editingProject}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProjectClick}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ImageLightbox
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        imageTitle={lightbox.title}
        onClose={() => setLightbox({ isOpen: false })}
      />

      <CloudinaryModal
        isOpen={isCloudinaryModalOpen}
        onClose={() => setIsCloudinaryModalOpen(false)}
        onConfigSaved={() => setCloudinaryActive(isCloudinaryConfigured())}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Floating Success Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;

