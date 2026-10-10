import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collegesApi, College } from '../api/colleges';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    collegesApi
      .getColleges()
      .then((data) => {
        setColleges(data);
        if (data.length > 0) setCollegeId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingColleges(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        collegeId,
      });
      setRegisteredSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check your university email address.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollege = colleges.find((c) => c.id === collegeId);

  if (registeredSuccess) {
    return (
      <div className="max-w-md mx-auto my-8 sm:my-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Check Your Student Inbox!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We've sent a verification email to <strong>{email}</strong>. Please click the link inside to activate your account.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            For development environments, the verification token was logged to the server console.
          </div>
          <Link
            to="/login"
            className="inline-block mt-4 gradient-brand text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16">
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white mx-auto shadow-glow-brand">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">
            Join Campus<span className="text-brand-600">Loop</span>
          </h1>
          <p className="text-xs text-slate-500">Create a verified account for your university</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Your University</label>
            <select
              required
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCollege?.approvedEmailDomains && selectedCollege.approvedEmailDomains.length > 0 && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Allowed domains: {selectedCollege.approvedEmailDomains.join(', ')}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">College Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@university.edu"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm shadow-md hover:opacity-95 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
