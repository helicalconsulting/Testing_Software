import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
  Cloud,
  Loader2,
  Database,
} from 'lucide-react';
import { Issue, IssueStatus, IssueSeverity } from '../types/issue';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../services/cloudinary';
import { apiUploadScreenshot } from '../services/api';

interface IssueModalProps {
  isOpen: boolean;
  projectId: string;
  nextSrNo: number;
  initialIssue?: Issue | null;
  onClose: () => void;
  onSave: (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onOpenCloudinarySettings?: () => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  projectId,
  nextSrNo,
  initialIssue,
  onClose,
  onSave,
  onOpenCloudinarySettings,
}) => {
  const isEdit = !!initialIssue;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [srNo, setSrNo] = useState<number>(nextSrNo);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [module, setModule] = useState<string>('');
  const [issue, setIssue] = useState<string>('');
  const [expectedResult, setExpectedResult] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [screenshotName, setScreenshotName] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<IssueStatus>('Open');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);
  const isCloudinaryReady = isCloudinaryConfigured();

  // Sync state when modal opens or initialIssue changes
  useEffect(() => {
    if (isOpen) {
      if (initialIssue) {
        setSrNo(initialIssue.srNo);
        setDate(initialIssue.date);
        setModule(initialIssue.module || '');
        setIssue(initialIssue.issue);
        setExpectedResult(initialIssue.expectedResult);
        setScreenshot(initialIssue.screenshot);
        setScreenshotName(initialIssue.screenshotName);
        setStatus(initialIssue.status);
        setSeverity(initialIssue.severity || 'Medium');
        setRemarks(initialIssue.remarks || '');
      } else {
        setSrNo(nextSrNo);
        setDate(new Date().toISOString().split('T')[0]);
        setModule('');
        setIssue('');
        setExpectedResult('');
        setScreenshot(undefined);
        setScreenshotName(undefined);
        setStatus('Open');
        setSeverity('Medium');
        setRemarks('');
      }
      setErrors({});
      setClipboardNotice(null);
    }
  }, [isOpen, initialIssue, nextSrNo]);

  // Handle Ctrl+V Paste anywhere in the modal window to grab screenshot
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file, `pasted_screenshot_${Date.now()}.png`);
            setClipboardNotice('Screenshot pasted directly from clipboard!');
            setTimeout(() => setClipboardNotice(null), 3000);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processImageFile = async (file: File, fallbackName?: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, SVG)');
      return;
    }

    const name = file.name || fallbackName || 'screenshot.png';
    setScreenshotName(name);

    if (isCloudinaryReady) {
      setIsUploadingImage(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file, name);
        setScreenshot(cloudUrl);
        setClipboardNotice('Screenshot uploaded to Cloudinary CDN! ☁️');
        setTimeout(() => setClipboardNotice(null), 3500);
      } catch (err: any) {
        console.warn('Cloudinary upload failed, attempting backend/local storage:', err);
        try {
          const uploaded = await apiUploadScreenshot(file);
          setScreenshot(uploaded.url);
          setClipboardNotice('Screenshot stored on backend server! 💾');
          setTimeout(() => setClipboardNotice(null), 3500);
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => {
            setScreenshot(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          setClipboardNotice('Cloudinary failed. Stored in local browser database.');
          setTimeout(() => setClipboardNotice(null), 4000);
        }
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      // Try backend upload first, fallback to browser IndexedDB if offline
      setIsUploadingImage(true);
      try {
        const uploaded = await apiUploadScreenshot(file);
        setScreenshot(uploaded.url);
        setClipboardNotice('Screenshot uploaded to backend server! 💾');
        setTimeout(() => setClipboardNotice(null), 3500);
      } catch (err) {
        console.log('Backend upload unavailable, using IndexedDB Base64 fallback:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          setScreenshot(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setClipboardNotice('Screenshot saved locally in browser database.');
        setTimeout(() => setClipboardNotice(null), 3000);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!issue.trim()) {
      newErrors.issue = 'Please describe the Issue / Error';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        projectId: projectId || 'proj-ecommerce',
        srNo: Number(srNo) || nextSrNo,
        date: date || new Date().toISOString().split('T')[0],
        module: module.trim() || 'General',
        issue: issue.trim(),
        expectedResult: expectedResult.trim() || 'Expected to function properly without error',
        screenshot,
        screenshotName,
        status: status || 'Open',
        severity: severity || 'Medium',
        remarks: remarks.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save issue:', err);
      alert('Error saving issue: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? `Edit Issue #${srNo}` : 'Log New QA Defect / Issue'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the defect report details, expected behavior, and screenshots
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clipboard Notification Toast */}
        {clipboardNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-4 sm:px-6 py-2 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {clipboardNotice}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {/* Row 1: Sr No, Date, Status, Severity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sr. No.
              </label>
              <input
                type="number"
                min="1"
                value={srNo}
                onChange={(e) => setSrNo(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Blocked">Blocked</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔵 Low</option>
              </select>
            </div>
          </div>

          {/* Row 2: Module Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Module / Feature Area
              </label>
              <span className="text-[11px] text-slate-400">Default: General</span>
            </div>
            <input
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="e.g. Checkout & Payments, Authentication, Dashboard..."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {errors.module && (
              <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.module}
              </span>
            )}
          </div>

          {/* Row 2: Issue / Error */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Issue / Error <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Describe the bug / error message observed</span>
            </div>
            <textarea
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. Login fails with '500 Server Error' when entering valid Google OAuth credentials..."
              className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-y ${
                errors.issue ? 'border-red-400 bg-red-50/30' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.issue && (
              <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.issue}
              </span>
            )}
          </div>

          {/* Row 3: Expected Result */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Expected Result
              </label>
              <span className="text-[11px] text-slate-400">What was supposed to happen according to specs</span>
            </div>
            <textarea
              rows={2}
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="e.g. User should be redirected to Dashboard and session token stored in cookie."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-y"
            />
          </div>

          {/* Row 4: Screenshot Upload & Clipboard Paste Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Screenshot (Drag & Drop, Browse, or Paste Ctrl+V)
                </label>
                {isCloudinaryReady ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-1.5 py-0.2 rounded">
                    <Cloud className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    Cloudinary Active
                  </span>
                ) : (
                  onOpenCloudinarySettings && (
                    <button
                      type="button"
                      onClick={onOpenCloudinarySettings}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:underline"
                    >
                      <Cloud className="w-3 h-3" />
                      Connect Cloudinary
                    </button>
                  )
                )}
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <ClipboardPaste className="w-3 h-3" />
                Ctrl+V to paste screenshot
              </span>
            </div>

            {isUploadingImage ? (
              <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 p-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-spin" />
                <span className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                  Uploading screenshot to Cloudinary...
                </span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400">Optimizing and storing on CDN</span>
              </div>
            ) : screenshot ? (
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3 flex items-center gap-4">
                <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center">
                  <img
                    src={screenshot}
                    alt="Screenshot preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {screenshotName || 'Attached Screenshot'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {screenshot.startsWith('/uploads') ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Stored on Backend Server
                      </span>
                    ) : screenshot.startsWith('http') ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-300 font-medium bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        <Cloud className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        Hosted on Cloudinary CDN
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">Image stored in IndexedDB</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-xs"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(undefined);
                      setScreenshotName(undefined);
                    }}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title="Remove Screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 rounded-xl p-5 text-center transition group"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Click to upload, drag and drop, or press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-xs">Ctrl+V</kbd>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      PNG, JPG, SVG, WebP {isCloudinaryReady ? '• Direct upload to Cloudinary' : '• Stored safely in local database'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Row 5: Remarks / Environment Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Remarks
              </label>
              <span className="text-[11px] text-slate-400">Environment, OS, Browser version, or dev notes</span>
            </div>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Reproduced on Chrome 128 (Windows 11). Test account: tester_beta@test.com. Build #2041."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-y"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Log Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
