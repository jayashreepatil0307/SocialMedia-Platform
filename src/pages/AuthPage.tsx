import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!username.trim() || !fullName.trim()) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await signUp(email, password, username.trim(), fullName.trim());
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/40 to-accent-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="flex justify-center mb-4 animate-float">
            <Logo size={64} withText={false} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-slate-800">Mitra</span><span className="gradient-text">Setu</span>
          </h1>
          <p className="text-slate-500 mt-2">Connecting Hearts Digitally</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 animate-fade-in-up">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    placeholder="janedoe"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-4 py-2.5 animate-shake">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 via-blue-500 to-accent-500 text-white font-semibold shadow-lg shadow-brand/30 hover:shadow-brand-lg/40 transition-all disabled:opacity-60"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          By signing up, you agree to MitraSetu's Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
