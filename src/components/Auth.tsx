import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSignUpSuccess(false);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSignUpSuccess(true);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0F172A]">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] animate-float delay-300" />

      <div className="w-full max-w-md relative z-10 p-6">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Life Reset
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Transform your life, one day at a time
          </p>
        </div>

        <div className="glass-panel rounded-[2rem] p-8 animate-slide-up delay-100 border-white/10 bg-white/5 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 ml-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-scale-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            {signUpSuccess && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 px-4 py-3 rounded-xl text-sm font-medium animate-scale-in">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Check your email!</p>
                    <p className="text-indigo-300/90 text-xs leading-relaxed">
                      We've sent you a confirmation link. Please check your inbox and click the link to verify your account before signing in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
