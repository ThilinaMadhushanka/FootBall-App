import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';

interface TeamPlayer {
  id: number;
  player_id: number;
  full_name: string;
  position: string;
  rating: number;
  position_in_team: string;
}

interface Team {
  id: number;
  manager_id: number;
  team_name: string;
  players: TeamPlayer[];
  total_rating: number;
  formation: string;
}

const MyTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await apiService.get('/teams/my-teams');
        setTeams(response.data);
      } catch (err) {
        setError('Failed to load teams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const getFormationLayout = (formation: string) => {
    const [defenders, midfielders, forwards] = formation.split('-').map(Number);
    return { defenders, midfielders, forwards };
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Teams</h1>

      {teams.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          You haven't created any teams yet.
        </div>
      ) : (
        <div className="space-y-8">
          {teams.map((team) => {
            const { defenders, midfielders, forwards } = getFormationLayout(team.formation);
            
            return (
              <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{team.team_name}</h2>
                  <div className="text-sm text-gray-500">
                    Formation: {team.formation}
                  </div>
                </div>

                <div className="relative h-96 bg-green-800 rounded-lg overflow-hidden">
                  {/* Field lines */}
                  <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Forwards */}
                    <div className="flex justify-around">
                      {Array.from({ length: forwards }).map((_, index) => {
                        const player = team.players.find(p => p.position_in_team === `F${index + 1}`);
                        return (
                          <div key={`F${index}`} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center">
                            {player ? (
                              <>
                                <div className="font-bold">{player.full_name}</div>
                                <div className="text-gray-500">{player.rating}</div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Midfielders */}
                    <div className="flex justify-around">
                      {Array.from({ length: midfielders }).map((_, index) => {
                        const player = team.players.find(p => p.position_in_team === `M${index + 1}`);
                        return (
                          <div key={`M${index}`} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center">
                            {player ? (
                              <>
                                <div className="font-bold">{player.full_name}</div>
                                <div className="text-gray-500">{player.rating}</div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Defenders */}
                    <div className="flex justify-around">
                      {Array.from({ length: defenders }).map((_, index) => {
                        const player = team.players.find(p => p.position_in_team === `D${index + 1}`);
                        return (
                          <div key={`D${index}`} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center">
                            {player ? (
                              <>
                                <div className="font-bold">{player.full_name}</div>
                                <div className="text-gray-500">{player.rating}</div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Goalkeeper */}
                    <div className="flex justify-center">
                      {(() => {
                        const goalkeeper = team.players.find(p => p.position_in_team === 'GK');
                        return (
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center">
                            {goalkeeper ? (
                              <>
                                <div className="font-bold">{goalkeeper.full_name}</div>
                                <div className="text-gray-500">{goalkeeper.rating}</div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Total Players: {team.players.length}/11
                    </div>
                    <div className="text-sm font-medium">
                      Team Rating: {team.total_rating}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeamsPage; 