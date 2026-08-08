import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { UploadCloud, Sparkles, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadOffer, type UploadResult } from '../api/upload.api';
import { StatusBadge } from '../components/StatusBadge';

export function OnboardingPage() {
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported');
      return;
    }
    setFileName(file.name);
    setProgress(0);
    setIsUploading(true);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    try {
      const data = await uploadOffer(file, setProgress);
      setResult(data);
      toast.success('Offer uploaded and workflow generated');
    } catch {
      setProgress(0);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  const tasks = result?.plan?.tasks ?? [];
  const approvals = result?.approvals ?? result?.plan?.approvals ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Offer intake</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Upload and extract onboarding context</h2>
        <div
          className={`mt-6 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragging ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10' : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud className={`mx-auto h-10 w-10 ${isDragging ? 'text-brand-600 dark:text-brand-300' : 'text-brand-500'}`} />
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Drag and drop the offer letter PDF</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The system will extract the employee profile and trigger workflow planning.</p>

          {isUploading ? (
            <div className="mx-auto mt-6 max-w-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-300">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </span>
                <span className="font-medium text-slate-600 dark:text-slate-400">{progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <label className="mt-6 inline-flex cursor-pointer rounded-xl bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
              Select file
              <input ref={inputRef} className="hidden" type="file" accept="application/pdf" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void processFile(file);
              }} />
            </label>
          )}

          {fileName ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <FileText className="h-4 w-4" /> {fileName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-300">
          <Sparkles className="h-5 w-5" />
          <p className="font-semibold">AI extraction preview</p>
        </div>
        {preview ? (
          <iframe title="offer preview" src={preview} className="mt-4 h-[320px] w-full rounded-2xl border border-slate-200 dark:border-slate-700" />
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">The uploaded document preview will appear here after selection.</div>
        )}

        {result ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-900/20">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{result.profile.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {result.profile.role} · {result.profile.department}
                </p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{result.workflow.title}</p>
                <StatusBadge status={result.workflow.status} />
              </div>
              {tasks.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Planned tasks</p>
                  <ul className="mt-2 space-y-1.5">
                    {tasks.map((task) => (
                      <li key={task.title} className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>{task.title}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{task.department}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {approvals.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Approval gates</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {approvals.map((approval) => (
                      <span key={approval.resource} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
                        {approval.resource}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
