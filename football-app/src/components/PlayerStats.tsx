import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerStats, PlayerStats } from '../utils/api';

const PlayerStatsComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!id) return;
        const data = await getPlayerStats(parseInt(id));
        setStats(data);
      } catch (err) {
        setError('Failed to load player statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id]);

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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Player Statistics</h2>
      
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
        Last updated: {new Date(stats.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default PlayerStatsComponent; 