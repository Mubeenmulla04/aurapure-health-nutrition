import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await login({ email, password });
      navigate('/account/profile');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-8 sm:p-10 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-brand-glow text-brand-primary mx-auto flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-brand-dark">Sign In to AuraPure</h1>
          <p className="text-xs text-brand-subtext">Access your orders, saved addresses, and wellness rewards.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-brand-error flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@aurapure.in"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <Mail className="w-4 h-4 text-brand-subtext absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-brand-dark">Password</label>
              <Link to="/account/forgot-password" className="text-xs text-brand-primary hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <Lock className="w-4 h-4 text-brand-subtext absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary gap-2 !py-3.5 text-sm font-semibold shadow-card"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-brand-subtext border-t border-brand-muted/70">
          <span>Don't have an account yet? </span>
          <Link to="/account/register" className="font-semibold text-brand-primary hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
