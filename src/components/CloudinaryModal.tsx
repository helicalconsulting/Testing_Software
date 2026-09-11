import React, { useState, useEffect } from 'react';
import { Cloud, X, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Key } from 'lucide-react';
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  CloudinaryConfig,
  uploadImageToCloudinary,
} from '../services/cloudinary';

interface CloudinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const CloudinaryModal: React.FC<CloudinaryModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [folder, setFolder] = useState('qa-defects');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getCloudinaryConfig();
      setCloudName(cfg.cloudName || '');
      setUploadPreset(cfg.uploadPreset || '');
      setFolder(cfg.folder || 'qa-defects');
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: CloudinaryConfig = {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
      folder: folder.trim() || 'qa-defects',
    };
    saveCloudinaryConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!cloudName.trim() || !uploadPreset.trim()) {
      setTestStatus('error');
      setTestMessage('Please fill in both Cloud Name and Upload Preset first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Uploading test image to Cloudinary...');

    try {
      // Save temporarily so service picks it up
      saveCloudinaryConfig({
        cloudName: cloudName.trim(),
        uploadPreset: uploadPreset.trim(),
        folder: folder.trim() || 'qa-defects',
      });

      // Create a tiny 1x1 test PNG blob
      const testBlob = await (
        await fetch(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        )
      ).blob();

      const url = await uploadImageToCloudinary(testBlob, 'test_connection.png');
      setTestStatus('success');
      setTestMessage(`Connected successfully! Test image uploaded to Cloudinary: ${url}`);
      onConfigSaved();
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Failed to upload test image.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cloudinary Cloud Storage</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Store all tester screenshots in Cloudinary CDN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4.5">
          {/* Info banner */}
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 rounded-xl text-sm text-sky-800 dark:text-sky-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-2 text-sm">
              <Key className="w-4 h-4" />
              Quick Setup (Unsigned Upload Preset):
            </div>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-sky-700 dark:text-sky-300 space-y-1 ml-1 leading-relaxed">
              <li>Log in to your free Cloudinary account (<a href="https://cloudinary.com/console" target="_blank" rel="noreferrer" className="underline font-semibold">cloudinary.com</a>).</li>
              <li>Go to <strong>Settings</strong> ➔ <strong>Upload</strong> ➔ <strong>Add upload preset</strong>.</li>
              <li>Set <strong>Signing Mode</strong> to <code>Unsigned</code> and copy its name.</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cloudinary Cloud Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="e.g. demo, my-company-qa, etc."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Unsigned Upload Preset <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="e.g. qa_defects_unsigned, ml_default"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cloudinary Folder (Optional)
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="qa-defects"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
            />
          </div>

          {/* Test Status Indicator */}
          {testStatus === 'success' && (
            <div className="p-3.5 text-sm bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="truncate text-sm">{testMessage}</div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-3.5 text-sm bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm">{testMessage}</div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/70 border border-sky-200 dark:border-sky-800 rounded-xl transition disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl shadow-xs transition"
              >
                Save Cloudinary Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
