import { useState } from 'react';
import { loginWithEmail } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-stone-950 relative overflow-hidden">
      {/* Background grain */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-white text-xs tracking-wider uppercase font-medium transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to site
        </Link>

        {/* Brand mark */}
        <div className="mb-10">
          <span className="text-2xl font-serif font-bold tracking-tight text-white">
            स्वप्न क्षितिज
          </span>
          <span className="block text-[0.55rem] font-sans tracking-[0.2em] text-stone-500 uppercase mt-1 font-medium">
            Design Concepts
          </span>
        </div>

        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-serif font-bold text-white leading-tight">Admin Access</h2>
          <p className="text-sm text-stone-500">Sign in to manage your portfolio dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-red-950/30 border border-red-900/40 px-4 py-3 text-red-300 text-sm"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label htmlFor="signin-email" className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all duration-300"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signin-password" className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-[#ea650a] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 text-sm font-semibold tracking-wider uppercase transition-all duration-300 hover:shadow-lg hover:shadow-[#f97316]/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </section>
  );
};
