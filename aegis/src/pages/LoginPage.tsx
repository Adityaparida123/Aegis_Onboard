import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { loginUser } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const response = await loginUser(values.email, values.password);
      const payload = response?.data ?? response;
      login({ name: payload.user?.name ?? 'Demo User', email: payload.user?.email ?? values.email, role: payload.user?.role ?? 'HR' }, payload.token);
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Unable to sign in. Please try again.');
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
            <h1 className="mt-10 text-3xl font-semibold">Operate onboarding with clarity and trust.</h1>
            <p className="mt-4 max-w-md text-sm text-slate-200">AI-assisted workflows, approvals, and audit logs come together in one control plane for modern teams.</p>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use your team credentials to access the control center.</p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
              <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link className="font-medium text-brand-600 hover:underline dark:text-brand-300" to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
