import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Trophy, Users } from 'lucide-react';
import api from '../../utils/api';

interface LoginProps {
  userType?: 'manager' | 'player' | 'viewer' | 'organizer';
}

const Login: React.FC<LoginProps> = () => {
  const { userType = 'manager' } = useParams<{ userType: 'manager' | 'player' | 'viewer' | 'organizer' }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const roleContent = {
    manager: {
      brandLabel: 'Team Manager',
      eyebrow: 'Build your football legacy',
      title: <>Build the squad.<br />Own the pitch.</>,
      description: 'Manage players, shape your formation, handle transfers and guide your team up the leaderboard.',
      features: [['Build your squad', 'Invite players and create a winning team.'], ['Lead the league', 'Manage fixtures, results and performance.']]
    },
    player: {
      brandLabel: 'Player Centre',
      eyebrow: 'Your career starts here',
      title: <>Train. Perform.<br />Get noticed.</>,
      description: 'Track your personal performance, receive team invitations and follow every step of your football career.',
      features: [['Track performance', 'Review goals, assists, ratings and match stats.'], ['Find your team', 'Accept invitations and transfer opportunities.']]
    },
    viewer: {
      brandLabel: 'Match Viewer',
      eyebrow: 'Your football match centre',
      title: <>Every match.<br />Every story.</>,
      description: 'Follow live scores, explore teams and compare player and team performance from one read-only football hub.',
      features: [['Watch the action', 'Follow live matches, scores and events.'], ['Explore the league', 'Browse players, teams, form and rankings.']]
    },
    organizer: {
      brandLabel: 'Competition Hub', eyebrow: 'Run your competition', title: <>Create leagues.<br />Shape seasons.</>, description: 'Launch competitions, register teams and manage the structure behind every football season.', features: [['Build competitions', 'Create leagues and seasonal tournaments.'], ['Manage participants', 'Add or remove registered teams.']]
    }
  }[userType];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post(`/login/${userType}`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', userType);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('auth-changed'));
      navigate(userType === 'organizer' ? '/competition-admin' : '/home');
    } catch {
      setError('Username or password is incorrect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <div className="relative z-10 max-w-lg">
          <div className="mb-12 flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-12 w-12" />
            <div><p className="text-xl font-extrabold">PlayerPro</p><p className="text-xs uppercase tracking-[0.22em] text-emerald-300">{roleContent.brandLabel}</p></div>
          </div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">{roleContent.eyebrow}</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">{roleContent.title}</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">{roleContent.description}</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Users className="mb-3 text-emerald-300" /><p className="font-bold">{roleContent.features[0][0]}</p><p className="mt-1 text-sm text-slate-400">{roleContent.features[0][1]}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Trophy className="mb-3 text-emerald-300" /><p className="font-bold">{roleContent.features[1][0]}</p><p className="mt-1 text-sm text-slate-400">{roleContent.features[1][1]}</p></div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Sign in to PlayerPro</h2>
            <p className="mt-2 text-sm text-slate-500">Choose your account type and continue your season.</p>
          </div>

          <div className="mb-7 grid grid-cols-4 rounded-xl bg-slate-100 p-1">
            {(['manager', 'player', 'viewer', 'organizer'] as const).map(type => (
              <Link key={type} to={`/login/${type}`} className={`rounded-lg px-4 py-2.5 text-center text-sm font-bold capitalize transition ${userType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{type}</Link>
            ))}
          </div>

          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block"><span className="auth-label">Username</span><input className="auth-input" name="username" autoComplete="username" required autoFocus value={formData.username} onChange={event => setFormData({ ...formData, username: event.target.value })} placeholder="Enter your username" /></label>
            <label className="block"><span className="auth-label">Password</span><span className="relative block"><input className="auth-input pr-12" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={formData.password} onChange={event => setFormData({ ...formData, password: event.target.value })} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'} {!submitting && <ArrowRight size={18} />}</button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">New to PlayerPro? <Link to={`/register/${userType}`} className="font-bold text-emerald-600 hover:text-emerald-700">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
};

export default Login;
