import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Shield, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import api from '../utils/api';

interface TeamDetails { id: number; name: string; founded_year: number; stadium: string; location: string; logo_url?: string; manager?: { full_name?: string; username?: string }; }
interface SquadPlayer { id: number; full_name: string; position: string; nationality: string; rating: number; goals: number; assists: number; profile_image_url?: string; }
interface MatchTeam { id?: number; name?: string; }
interface TeamMatch { id: number; team1_id: number; team2_id: number; team1?: MatchTeam; team2?: MatchTeam; match_date: string; match_time: string; venue: string; status: string; score_team1: number; score_team2: number; }

const TeamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/teams/${id}`), api.get(`/teams/${id}/players`)])
      .then(async ([teamResponse, playersResponse]) => {
        setTeam(teamResponse.data);
        setPlayers(Array.isArray(playersResponse.data) ? playersResponse.data : []);
        const matchResponse = await api.get(`/matches/team/${encodeURIComponent(teamResponse.data.name)}`);
        setMatches(Array.isArray(matchResponse.data) ? matchResponse.data : []);
      })
      .catch(() => setError('Failed to load team details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" /></div>;
  if (error || !team) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error || 'Team not found'}</div>;

  const completedMatches = matches.filter(match => match.status === 'completed');
  const outcome = (match: TeamMatch) => {
    const home = match.team1_id === team.id || match.team1?.id === team.id;
    const scored = home ? match.score_team1 : match.score_team2;
    const conceded = home ? match.score_team2 : match.score_team1;
    return { scored, conceded, result: scored > conceded ? 'W' : scored < conceded ? 'L' : 'D' };
  };
  const outcomes = completedMatches.map(outcome);
  const wins = outcomes.filter(item => item.result === 'W').length;
  const draws = outcomes.filter(item => item.result === 'D').length;
  const losses = outcomes.filter(item => item.result === 'L').length;
  const goalsFor = outcomes.reduce((sum, item) => sum + item.scored, 0);
  const goalsAgainst = outcomes.reduce((sum, item) => sum + item.conceded, 0);
  const winRate = completedMatches.length ? Math.round((wins / completedMatches.length) * 100) : 0;
  const recentMatches = completedMatches.slice(0, 5);

  return <div className="space-y-7">
    <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600"><ArrowLeft size={16} /> Back to leaderboard</Link>

    <section className="overflow-hidden rounded-2xl bg-slate-950 p-7 text-white shadow-xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white/10">{team.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-contain" /> : <Shield className="text-emerald-300" size={44} />}</div>
        <div><p className="text-sm font-bold uppercase tracking-wider text-emerald-300">Team profile</p><h1 className="mt-1 text-4xl font-black">{team.name}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300"><span className="flex items-center gap-1"><MapPin size={15} /> {team.stadium}, {team.location}</span><span>Founded {team.founded_year}</span><span>Manager: {team.manager?.full_name || team.manager?.username || 'N/A'}</span></div></div>
      </div>
    </section>

    <section>
      <div className="mb-4"><h2 className="text-2xl font-black text-slate-900">Team Performance</h2><p className="text-sm text-slate-500">Calculated from completed match results.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Trophy size={22} />} value={wins} label={`Wins · ${draws} draws · ${losses} losses`} color="text-emerald-500" />
        <StatCard icon={<TrendingUp size={22} />} value={`${winRate}%`} label="Win rate" color="text-blue-500" />
        <StatCard icon={<Target size={22} />} value={goalsFor} label="Goals scored" color="text-violet-500" />
        <StatCard icon={<Shield size={22} />} value={goalsAgainst} label="Goals conceded" color="text-amber-500" />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">Recent results</h3><p className="text-sm text-slate-500">Last {recentMatches.length} completed matches</p></div><div className="flex gap-1">{recentMatches.map(match => <FormBadge key={match.id} result={outcome(match).result} />)}</div></div>
        {recentMatches.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No completed matches yet.</p> : <div className="divide-y divide-slate-100">{recentMatches.map(match => <Link key={match.id} to={`/matches/${match.id}/events`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-4 text-sm transition hover:text-emerald-600"><div><p className="font-bold">{match.team1?.name || 'Team 1'}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={12} /> {new Date(match.match_date).toLocaleDateString()}</p></div><span className="rounded-lg bg-slate-950 px-3 py-2 font-black text-white">{match.score_team1} - {match.score_team2}</span><div className="text-right"><p className="font-bold">{match.team2?.name || 'Team 2'}</p><p className="mt-1 text-xs text-slate-400">{match.venue}</p></div></Link>)}</div>}
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black text-slate-900">Squad</h2><p className="text-sm text-slate-500">Select a player to view complete performance details.</p></div><span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700"><Users size={16} /> {players.length}</span></div>
      {players.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No players currently assigned to this team.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{players.map(player => <Link key={player.id} to={`/players/${player.id}/stats`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100 font-black text-slate-500">{player.profile_image_url ? <img src={player.profile_image_url} alt={player.full_name} className="h-full w-full object-cover" /> : player.full_name.charAt(0)}</div><div><h3 className="font-black text-slate-900 group-hover:text-emerald-600">{player.full_name}</h3><p className="text-sm text-slate-500">{player.position} · {player.nationality}</p></div></div><div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-4 text-center text-sm"><div><b>{player.rating || 0}</b><span className="block text-xs text-slate-400">Rating</span></div><div><b>{player.goals || 0}</b><span className="block text-xs text-slate-400">Goals</span></div><div><b>{player.assists || 0}</b><span className="block text-xs text-slate-400">Assists</span></div></div></Link>)}</div>}
    </section>
  </div>;
};

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode; value: React.ReactNode; label: string; color: string }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={color}>{icon}</span><p className="mt-4 text-3xl font-black">{value}</p><p className="text-sm text-slate-500">{label}</p></div>;
const FormBadge = ({ result }: { result: string }) => <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${result === 'W' ? 'bg-emerald-100 text-emerald-700' : result === 'L' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{result}</span>;

export default TeamDetailsPage;
