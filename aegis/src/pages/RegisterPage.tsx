import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { registerUser } from '../api/auth.api';

const ROLES = ['HR', 'Admin', 'IT', 'Finance', 'Security Manager'];

function toErrorString(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return '';
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unable to create account. Please try again.';
  }

  const err = error as { response?: { data?: unknown }; message?: unknown };
  const data = err.response?.data;

  if (data && typeof data === 'object') {
    const serverError = (data as { error?: unknown }).error;
    const fallback = toErrorString(serverError);
    if (fallback) {
      return fallback;
    }
  }

  const axiosMessage = toErrorString(err.message);
  return axiosMessage || 'Unable to create account. Please try again.';
}

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['HR', 'Admin', 'IT', 'Finance', 'Security Manager'])
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'HR' }
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await registerUser(values.name, values.email, values.password, values.role);
      toast.success('Account created — sign in with your credentials');
      navigate('/login');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-brand-600 to-slate-900 p-8 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <p className="text-lg font-semibold">Aegis Ops</p>
                <p className="text-sm text-slate-200">Intelligent onboarding and provisioning</p>
              </div>
            </div>
            <h1 className="mt-10 text-3xl font-semibold">Create your control center account.</h1>
            <p className="mt-4 max-w-md text-sm text-slate-200">Register once, then sign in to run AI-assisted workflows, approvals, and audit logs.</p>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Set up credentials to access the control center.</p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input className="w-full bg-transparent outline-none dark:text-slate-200" type="text" placeholder="Ada Lovelace" {...register('name')} />
                </div>
                {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input className="w-full bg-transparent outline-none dark:text-slate-200" type="email" placeholder="you@company.com" {...register('email')} />
                </div>
                {errors.email ? <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input className="w-full bg-transparent outline-none dark:text-slate-200" type="password" placeholder="••••••••" {...register('password')} />
                </div>
                {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input className="w-full bg-transparent outline-none dark:text-slate-200" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                </div>
                {errors.confirmPassword ? <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p> : null}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" {...register('role')}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role ? <p className="mt-1 text-sm text-rose-600">{errors.role.message}</p> : null}
              </label>
              <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link className="font-medium text-brand-600 hover:underline dark:text-brand-300" to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
