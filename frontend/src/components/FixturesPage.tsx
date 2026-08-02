import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useCompetition } from '../context/CompetitionContext';

interface Match {
  id: number;
  team1: TeamReference;
  team2: TeamReference;
  match_date: string;
  match_time: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';
  score_team1: number;
  score_team2: number;
}

type TeamReference = string | { name?: string } | null;

const getTeamName = (team: TeamReference): string => {
  if (typeof team === 'string') return team;
  return team?.name || 'TBD';
};

const FixturesPage: React.FC = () => {
  const { selectedCompetition, selectedSeason, selectedSeasonID } = useCompetition();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await api.get('/matches', { params: selectedSeasonID ? { season_id: selectedSeasonID } : {} });
        setMatches(response.data);
      } catch (err) {
        setError('Failed to load matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedSeasonID]);

  const filteredMatches = (matches || []).filter(match => 
    statusFilter === '' || match.status === statusFilter
  );

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Fixtures & Results</h1>
      <p className="mb-6 text-sm text-slate-500">{selectedCompetition?.name || 'All competitions'} {selectedSeason ? `· ${selectedSeason.name}` : ''}</p>

      <div className="mb-6">
        <select
          className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Matches</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <Link
            key={match.id}
            to={`/matches/${match.id}/events`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                  {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                </span>
                <span className="text-gray-500">
                  {new Date(match.match_date).toLocaleDateString()} at {match.match_time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <h3 className="text-lg font-semibold">{getTeamName(match.team1)}</h3>
                  {match.status === 'completed' && (
                    <span className="text-2xl font-bold">{match.score_team1}</span>
                  )}
                </div>

                <div className="mx-4 text-gray-400">vs</div>

                <div className="flex-1 text-center">
                  <h3 className="text-lg font-semibold">{getTeamName(match.team2)}</h3>
                  {match.status === 'completed' && (
                    <span className="text-2xl font-bold">{match.score_team2}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                Venue: {match.venue}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No matches found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default FixturesPage; 
