import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center dark:bg-slate-950">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">The page you are looking for does not exist or has been moved.</p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
