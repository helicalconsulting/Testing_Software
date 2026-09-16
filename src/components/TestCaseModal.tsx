import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { TestCase, TestCaseStatus } from '../types/testCase';

interface TestCaseModalProps {
  isOpen: boolean;
  projectId: string;
  nextSrNo: number;
  initialTestCase?: TestCase | null;
  onClose: () => void;
  onSave: (testCaseData: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  projectId,
  nextSrNo,
  initialTestCase,
  onClose,
  onSave,
}) => {
  const isEdit = !!initialTestCase;

  const [srNo, setSrNo] = useState<number>(nextSrNo);
  const [module, setModule] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [expectedResult, setExpectedResult] = useState<string>('');
  const [status, setStatus] = useState<TestCaseStatus>('Pending');
  const [assignedBy, setAssignedBy] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialTestCase) {
        setSrNo(initialTestCase.srNo);
        setModule(initialTestCase.module || '');
        setTitle(initialTestCase.title || '');
        setExpectedResult(initialTestCase.expectedResult || '');
        setStatus(initialTestCase.status || 'Pending');
        setAssignedBy(initialTestCase.assignedBy || '');
        setRemarks(initialTestCase.remarks || '');
      } else {
        setSrNo(nextSrNo);
        setModule('');
        setTitle('');
        setExpectedResult('Expected to function properly without error');
        setStatus('Pending');
        setAssignedBy('');
        setRemarks('');
      }
      setErrors({});
    }
  }, [isOpen, initialTestCase, nextSrNo]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Test case target description is required';
    }
    if (!module.trim()) {
      newErrors.module = 'Module name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        projectId,
        srNo,
        module: module.trim(),
        title: title.trim(),
        expectedResult: expectedResult.trim() || 'Expected to function properly without error',
        status,
        assignedBy: assignedBy.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save test case:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Targeted Test Case' : 'Add Targeted Test Case'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit
                  ? `Editing Test Case #${srNo}`
                  : 'Assign a targeted test case for QA verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sr. No. */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Sr. No.
              </label>
              <input
                type="number"
                value={srNo}
                onChange={(e) => setSrNo(parseInt(e.target.value) || nextSrNo)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Assigned By */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Assigned By
              </label>
              <input
                type="text"
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Module */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.module ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.module && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.module}
              </p>
            )}
          </div>

          {/* Test Case Target / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Targeted Test Case / Feature to Check <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Expected Result */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Expected Result
            </label>
            <textarea
              rows={2}
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TestCaseStatus)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
            >
              <option value="Pending">🟡 Pending</option>
              <option value="Passed">🟢 Passed</option>
              <option value="Failed">🔴 Failed</option>
              <option value="Blocked">🟣 Blocked</option>
            </select>
          </div>

          {/* Remarks / Feedback */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              QA Remarks / Findings
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Update Test Case' : 'Add Test Case'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
