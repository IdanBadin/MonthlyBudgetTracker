import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { GoogleIcon } from './icons/GoogleIcon';
import toast from 'react-hot-toast';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        toast.success('Account created successfully!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7FF] dark:bg-[#09090B]">
      <div className="w-full max-w-sm relative">
        <div className="absolute w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -top-20 left-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {isSignUp ? 'Start tracking your finances' : 'Sign in to your account'}
          </p>
        </div>

        <div className="glass-modal p-8 w-full max-w-sm relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/8 transition-all duration-200 cursor-pointer mb-5"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-transparent text-xs text-slate-400">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/70 dark:text-indigo-400/50" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="modern-input pl-10"
                  placeholder="Full name"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/70 dark:text-indigo-400/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modern-input pl-10"
                placeholder="Email address"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/70 dark:text-indigo-400/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input pl-10"
                placeholder="Password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-500 dark:text-indigo-400 font-semibold hover:text-indigo-600"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
