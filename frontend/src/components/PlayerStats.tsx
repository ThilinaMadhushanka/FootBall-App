import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerStats, PlayerStats } from '../utils/api';
import api from '../utils/api';
import { useCompetition } from '../context/CompetitionContext';

interface PlayerDetails {
  full_name: string;
  username: string;
  position: string;
  nationality: string;
  age: number;
  rating: number;
  current_team?: string | { name?: string } | null;
  profile_image_url?: string;
}

const PlayerStatsComponent: React.FC = () => {
  const { selectedCompetition, selectedSeason, selectedSeasonID } = useCompetition();
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!id) return;
        const playerID = parseInt(id);
        const [statsData, playerResponse] = await Promise.all([
          selectedSeasonID ? api.get(`/seasons/${selectedSeasonID}/players/${playerID}/stats`).then(response => response.data as PlayerStats) : getPlayerStats(playerID),
          api.get(`/players/${playerID}`),
        ]);
        setStats(statsData);
        setPlayer(playerResponse.data);
      } catch (err) {
        setError('Failed to load player statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id, selectedSeasonID]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No statistics available for this player.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {player && (
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-emerald-400 text-2xl font-black text-slate-950">
              {player.profile_image_url ? <img src={player.profile_image_url} alt={player.full_name} className="h-full w-full object-cover" /> : player.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">{player.position}</p>
              <h1 className="mt-1 text-3xl font-black">{player.full_name}</h1>
              <p className="mt-1 text-sm text-slate-400">{typeof player.current_team === 'string' ? player.current_team : player.current_team?.name || 'No team'} · {player.nationality} · Age {player.age}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white/10 px-6 py-4 text-center sm:mt-0"><p className="text-xs uppercase tracking-wider text-slate-400">Rating</p><p className="text-3xl font-black text-emerald-300">{player.rating || 0}</p></div>
        </div>
      )}

    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">{selectedCompetition ? 'Competition Performance' : 'Career Performance'}</h2>
      {selectedCompetition && <p className="mb-6 text-sm text-slate-500">{selectedCompetition.name} · {selectedSeason?.name}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Games Played</span>
              <span className="font-medium">{stats.games_played}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minutes Played</span>
              <span className="font-medium">{stats.minutes_played}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pass Accuracy</span>
              <span className="font-medium">{stats.pass_accuracy.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Attacking</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Goals</span>
              <span className="font-medium">{stats.goals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assists</span>
              <span className="font-medium">{stats.assists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shots on Target</span>
              <span className="font-medium">{stats.shots_on_target}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Defensive</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Clean Sheets</span>
              <span className="font-medium">{stats.clean_sheets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yellow Cards</span>
              <span className="font-medium">{stats.yellow_cards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Red Cards</span>
              <span className="font-medium">{stats.red_cards}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Last updated: {stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Not recorded'}
      </div>
    </div>
    </div>
  );
};

export default PlayerStatsComponent; 
