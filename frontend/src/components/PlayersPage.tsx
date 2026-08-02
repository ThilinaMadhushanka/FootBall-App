import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useCompetition } from '../context/CompetitionContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';

interface Player {
  id: number;
  username: string;
  full_name: string;
  position: string;
  age: number;
  nationality: string;
  current_team: string | { id?: number; name?: string } | null;
  current_team_id?: number | null;
  rating: number;
  price: number;
  experience_years: number;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string;
  is_available: boolean;
  profile_image_url: string;
}

const PlayersPage: React.FC = () => {
  const { selectedCompetition, selectedSeason, selectedSeasonID } = useCompetition();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [managedTeamID, setManagedTeamID] = useState<number | null>(null);
  const [requestStatus, setRequestStatus] = useState<Record<number, string>>({});
  const [competitionTeamIDs, setCompetitionTeamIDs] = useState<number[]>([]);
  const [offerPlayer, setOfferPlayer] = useState<Player | null>(null);
  const [offerForm, setOfferForm] = useState({ transfer_fee:'0', salary_per_season:'10000000', signing_bonus:'0', contract_months:'24', expiry_days:'7', message:'' });
  const [offerError, setOfferError] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.get('/players');
        setPlayers(response.data);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();

    if (selectedSeasonID) {
      api.get(`/seasons/${selectedSeasonID}/teams`).then(response => setCompetitionTeamIDs((Array.isArray(response.data) ? response.data : []).map((team: any) => team.id))).catch(() => setCompetitionTeamIDs([]));
    } else {
      setCompetitionTeamIDs([]);
    }

    if (localStorage.getItem('userType') === 'manager') {
      api.get('/teams/my-teams').then(response => {
        if (Array.isArray(response.data) && response.data[0]?.id) setManagedTeamID(response.data[0].id);
      }).catch(() => undefined);
    }
  }, [selectedSeasonID]);

  const requestPlayer = async (event: React.MouseEvent, player: Player) => {
    event.preventDefault();
    event.stopPropagation();
    if (!managedTeamID) return;
    setRequestStatus(previous => ({ ...previous, [player.id]: 'Sending…' }));
    try {
      await api.post(`/teams/${managedTeamID}/requests`, { player_id: player.id });
      setRequestStatus(previous => ({ ...previous, [player.id]: 'Request sent' }));
    } catch (err: any) {
      setRequestStatus(previous => ({ ...previous, [player.id]: err.response?.data?.error || 'Failed' }));
    }
  };

  const sendContractOffer = async (event: React.FormEvent) => {
    event.preventDefault(); if (!offerPlayer || !selectedSeasonID) return;
    setOfferError('');
    setOfferSubmitting(true);
    setRequestStatus(previous => ({...previous,[offerPlayer.id]:'Sending offer...'}));
    try {
      await api.post('/contract-offers', { player_id:offerPlayer.id, season_id:selectedSeasonID, transfer_fee:Number(offerForm.transfer_fee), salary_per_season:Number(offerForm.salary_per_season), signing_bonus:Number(offerForm.signing_bonus), contract_months:Number(offerForm.contract_months), expiry_days:Number(offerForm.expiry_days), message:offerForm.message });
      setRequestStatus(previous => ({...previous,[offerPlayer.id]:'Contract offer sent'}));
      setOfferPlayer(null);
      setOfferForm({ transfer_fee:'0', salary_per_season:'10000000', signing_bonus:'0', contract_months:'24', expiry_days:'7', message:'' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Contract offer could not be sent.';
      setOfferError(message);
      setRequestStatus(previous => ({...previous,[offerPlayer.id]:'Make Contract Offer'}));
    } finally {
      setOfferSubmitting(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === '' || player.position === positionFilter;
    const isFreePlayer = !player.current_team_id;
    const belongsToCompetition = !selectedSeasonID || competitionTeamIDs.includes(Number(player.current_team_id)) || (localStorage.getItem('userType') === 'manager' && isFreePlayer);
    return matchesSearch && matchesPosition && belongsToCompetition;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Players</h1>
      <p className="mb-6 text-sm text-slate-500">{selectedCompetition?.name || 'All competitions'} {selectedSeason ? `· ${selectedSeason.name}` : ''}</p>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search players..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">All Positions</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <Link
            key={player.id}
            to={`/players/${player.id}/stats`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <img
                  src={player.profile_image_url}
                  alt={player.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{player.full_name}</h2>
                  <p className="text-gray-600">@{player.username}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{player.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{player.age}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{player.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{player.rating}/100</p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {player.experience_years} years experience
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  player.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {player.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <Typography variant="body2" color="text.secondary">
                Height: {player.height_cm ? `${player.height_cm} cm` : 'N/A'}
              </Typography>
              {managedTeamID && player.current_team_id !== managedTeamID && player.is_available && (
                <button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOfferError(''); setOfferPlayer(player); }} disabled={!selectedSeasonID || requestStatus[player.id] === 'Contract offer sent'} className="mt-4 w-full rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                  {requestStatus[player.id] || 'Make Contract Offer'}
                </button>
              )}
              {managedTeamID && !player.is_available && (
                <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-400">
                  Not accepting offers
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>

      {offerPlayer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => !offerSubmitting && setOfferPlayer(null)}><form onSubmit={sendContractOffer} onClick={event => event.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Contract offer</p><h2 className="text-2xl font-black">{offerPlayer.full_name}</h2><p className="text-sm text-slate-500">{selectedCompetition?.name} · {selectedSeason?.name}</p></div><button type="button" disabled={offerSubmitting} onClick={() => setOfferPlayer(null)} className="text-2xl text-slate-400 disabled:opacity-40">×</button></div>{offerError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{offerError}</div>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="auth-label">Transfer fee</span><input required min="0" type="number" className="auth-input" value={offerForm.transfer_fee} onChange={e => setOfferForm({...offerForm,transfer_fee:e.target.value})} /></label><label><span className="auth-label">Salary per season</span><input required min="1" type="number" className="auth-input" value={offerForm.salary_per_season} onChange={e => setOfferForm({...offerForm,salary_per_season:e.target.value})} /></label><label><span className="auth-label">Signing bonus</span><input required min="0" type="number" className="auth-input" value={offerForm.signing_bonus} onChange={e => setOfferForm({...offerForm,signing_bonus:e.target.value})} /></label><label><span className="auth-label">Contract length</span><select className="auth-input" value={offerForm.contract_months} onChange={e => setOfferForm({...offerForm,contract_months:e.target.value})}><option value="6">6 months</option><option value="12">1 year</option><option value="24">2 years</option><option value="36">3 years</option><option value="48">4 years</option><option value="60">5 years</option></select></label><label><span className="auth-label">Offer expires in</span><select className="auth-input" value={offerForm.expiry_days} onChange={e => setOfferForm({...offerForm,expiry_days:e.target.value})}><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option></select></label><label className="sm:col-span-2"><span className="auth-label">Message</span><textarea className="auth-input" rows={3} value={offerForm.message} onChange={e => setOfferForm({...offerForm,message:e.target.value})} placeholder="Why you want this player..." /></label></div><button disabled={offerSubmitting} className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">{offerSubmitting ? 'Sending offer...' : 'Send contract offer'}</button></form></div>}

      {filteredPlayers.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No players found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default PlayersPage; 
