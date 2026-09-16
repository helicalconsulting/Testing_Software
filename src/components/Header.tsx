import React, { useRef, useState, useEffect } from 'react';
import {
  Bug,
  FolderKanban,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  ChevronDown,
  Edit3,
  Trash2,
  Cloud,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Keyboard,
  Menu,
  X,
  Database,
} from 'lucide-react';
import { Project, Issue } from '../types/issue';
import { TestCase } from '../types/testCase';
import { exportIssuesToCSV, exportTestCasesToCSV, exportProjectToJSON } from '../utils/export';

interface HeaderProps {
  projects: Project[];
  activeProject: Project | null;
  issues: Issue[];
  testCases?: TestCase[];
  activeTab?: 'issues' | 'testCases';
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenEditProjectModal: () => void;
  onDeleteProject: () => void;
  onOpenNewIssueModal: () => void;
  onImportJSON: (file: File) => void;
  onOpenCloudinaryModal: () => void;
  isCloudinaryActive: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenShortcutsModal: () => void;
  isBackendOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  issues,
  testCases = [],
  activeTab = 'issues',
  onSelectProject,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onDeleteProject,
  onOpenNewIssueModal,
  onImportJSON,
  onOpenCloudinaryModal,
  isCloudinaryActive,
  isDarkMode,
  onToggleDarkMode,
  isSoundEnabled,
  onToggleSound,
  onOpenShortcutsModal,
  isBackendOnline = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Close project dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-4">
          {/* App Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md shadow-blue-500/10 active:scale-95 transition-transform shrink-0 overflow-hidden p-1">
              <img src="/Procnex-logo.jpeg" alt="Procnex Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-xs xs:text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  QA Issue Logger
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xl:block">
                Defect Tracking & Test Management Workspace
              </p>
            </div>
          </div>

          {/* Center: Project Switcher Dropdown */}
          <div className="flex items-center min-w-0">
            <div className="relative max-w-full" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 rounded-xl p-0.5 sm:p-1 transition shadow-xs text-left"
              >
                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2.5 py-0.5 sm:py-1.5 cursor-pointer">
                  <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-left min-w-0">
                    <span className="text-[8px] sm:text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block leading-none">
                      Project
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 max-w-[70px] xs:max-w-[110px] sm:max-w-[180px] truncate block">
                        {activeProject?.name || 'Select'}
                      </span>
                      {activeProject?.prefix && (
                        <span className="hidden md:inline-block px-1.5 py-0.2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">
                          {activeProject.prefix}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-40 animate-fadeIn">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Project
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                          proj.id === activeProject?.id
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{proj.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          {proj.prefix}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1 space-y-1">
                    <button
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenNewProjectModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Project
                    </button>
                    {activeProject && (
                      <button
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          onOpenEditProjectModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Project Settings
                      </button>
                    )}
                    {/* Delete Project is ALWAYS accessible whenever activeProject exists (even if it's the last one) */}
                    {activeProject && (
                      <button
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          onDeleteProject();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Current Project
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cloudinary Settings Button */}
            <button
              onClick={onOpenCloudinaryModal}
              title={
                isCloudinaryActive
                  ? 'Cloudinary CDN Connected'
                  : 'Configure Cloudinary CDN for Screenshots'
              }
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition shadow-xs active:scale-95 ${
                isCloudinaryActive
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  isCloudinaryActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                }`}
              />
              <span className="hidden xl:inline">Cloudinary</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudinaryActive
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            </button>

            {/* Export CSV Button */}
            {activeProject && (
              <button
                onClick={() => {
                  if (activeTab === 'testCases') {
                    exportTestCasesToCSV(activeProject, testCases);
                  } else {
                    exportIssuesToCSV(activeProject, issues);
                  }
                }}
                title={
                  activeTab === 'testCases'
                    ? 'Export Targeted Test Cases to CSV (Excel format)'
                    : 'Export Issues to CSV (Excel format)'
                }
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition shadow-xs active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={isSoundEnabled ? 'Sound Effects Enabled (Click to mute)' : 'Sound Effects Muted'}
              className="hidden xs:flex p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition active:scale-95"
            >
              {isSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode (Press D)' : 'Switch to Dark Mode (Press D)'}
              aria-label="Toggle Theme"
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Keyboard Shortcuts Helper */}
            <button
              onClick={onOpenShortcutsModal}
              title="Keyboard Shortcuts (?)"
              className="hidden sm:flex p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition active:scale-95"
            >
              <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>

            {/* Primary CTA: Log Issue */}
            <button
              type="button"
              onClick={onOpenNewIssueModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl shadow-md shadow-blue-500/25 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Log Issue</span>
              <span className="xs:hidden">Log</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="More actions"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
            {/* Mobile Project Management Section */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Project
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  [{activeProject?.prefix || 'QA'}]
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeProject?.name || 'No Project Selected'}
              </div>

              {projects.length > 1 && (
                <div className="pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">Switch Project:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                          p.id === activeProject?.id
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    onOpenNewProjectModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </button>

                {activeProject && (
                  <button
                    onClick={() => {
                      onOpenEditProjectModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Settings
                  </button>
                )}

                {/* Delete Project Button: ALWAYS accessible even when 1 project remains */}
                {activeProject && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onDeleteProject();
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition border border-red-200 dark:border-red-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Current Project
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onToggleDarkMode();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onOpenCloudinaryModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                <Cloud className="w-4 h-4 text-sky-500" />
                Cloudinary CDN
              </button>

              {activeProject && (
                <button
                  onClick={() => {
                    if (activeTab === 'testCases') {
                      exportTestCasesToCSV(activeProject, testCases);
                    } else {
                      exportIssuesToCSV(activeProject, issues);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{activeTab === 'testCases' ? 'Export Test Cases' : 'Export CSV'}</span>
                </button>
              )}

              {activeProject && (
                <button
                  onClick={() => {
                    exportProjectToJSON(activeProject, issues);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Backup JSON
                </button>
              )}

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                Import JSON
              </button>

              <button
                onClick={() => {
                  onOpenShortcutsModal();
                  setIsMobileMenuOpen(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                <Keyboard className="w-4 h-4 text-slate-500" />
                Keyboard Shortcuts Guide
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
