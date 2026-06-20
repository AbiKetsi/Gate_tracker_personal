import React, { useState } from 'react';
import { supabase } from '../supabase';
import { BookOpen, Loader2 } from 'lucide-react';

export default function SignUp({ onLoginClick }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // If auto-logged in, a session will exist immediately
      if (data?.user && data?.session === null) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-200">
            <BookOpen size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-4">
            Create Account
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Sign up to start tracking your GATE exam preparation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-medium space-y-3">
            <p className="font-bold text-emerald-900 text-sm">Account created!</p>
            <p>Please check your email to verify your address before logging in.</p>
            <button
              onClick={onLoginClick}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Go to Login Page
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username / Display Name
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. abitha"
                className="w-full px-3.5 py-2.5 text-slate-700 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@example.com"
                className="w-full px-3.5 py-2.5 text-slate-700 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-slate-700 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-slate-700 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
        )}

        {/* Redirect */}
        {!success && (
          <div className="text-center text-xs font-semibold text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-brand-600 hover:text-brand-700 hover:underline"
            >
              Log In Instead
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
