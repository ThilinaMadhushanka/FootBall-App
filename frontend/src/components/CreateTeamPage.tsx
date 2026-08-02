import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Player {
  id: number;
  full_name: string;
  position: string;
  team: string;
  rating: number;
  price: number;
}

interface TeamFormation {
  name: string;
  layout: string;
}

const formations: TeamFormation[] = [
  { name: '4-4-2', layout: '4-4-2' },
  { name: '4-3-3', layout: '4-3-3' },
  { name: '3-5-2', layout: '3-5-2' },
  { name: '5-3-2', layout: '5-3-2' },
];

const CreateTeamPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [selectedFormation, setSelectedFormation] = useState(formations[0]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<{ [key: string]: Player | null }>({
    GK: null,
    D1: null, D2: null, D3: null, D4: null, D5: null,
    M1: null, M2: null, M3: null, M4: null, M5: null,
    F1: null, F2: null, F3: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState(1000000); // 1M budget
  const [filter, setFilter] = useState({
    position: 'ALL',
    search: '',
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.get('/players');
        setPlayers(response.data);
      } catch (err) {
        setError('Failed to load players');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const getFormationLayout = (formation: string) => {
    const [defenders, midfielders, forwards] = formation.split('-').map(Number);
    return { defenders, midfielders, forwards };
  };

  const calculateTotalCost = () => {
    return Object.values(selectedPlayers)
      .filter(player => player !== null)
      .reduce((total, player) => total + (player?.price || 0), 0);
  };

  const calculateRemainingBudget = () => {
    return budget - calculateTotalCost();
  };

  const handlePlayerSelect = (position: string, player: Player) => {
    if (player.price > calculateRemainingBudget() + (selectedPlayers[position]?.price || 0)) {
      alert('Not enough budget!');
      return;
    }
    setSelectedPlayers(prev => ({
      ...prev,
      [position]: player
    }));
  };

  const handlePlayerRemove = (position: string) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [position]: null
    }));
  };

  const handleCreateTeam = async () => {
    if (!teamName) {
      alert('Please enter a team name');
      return;
    }

    const selectedPlayersCount = Object.values(selectedPlayers).filter(p => p !== null).length;
    if (selectedPlayersCount !== 11) {
      alert('Please select exactly 11 players');
      return;
    }

    try {
      await api.post('/teams', {
        team_name: teamName,
        formation: selectedFormation.layout,
        players: Object.entries(selectedPlayers)
          .filter(([_, player]) => player !== null)
          .map(([position, player]) => ({
            player_id: player!.id,
            position_in_team: position
          }))
      });
      alert('Team created successfully!');
      // Reset form
      setTeamName('');
      setSelectedFormation(formations[0]);
      setSelectedPlayers({
        GK: null,
        D1: null, D2: null, D3: null, D4: null, D5: null,
        M1: null, M2: null, M3: null, M4: null, M5: null,
        F1: null, F2: null, F3: null,
      });
    } catch (err) {
      alert('Failed to create team');
      console.error(err);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesPosition = filter.position === 'ALL' || player.position === filter.position;
    const matchesSearch = player.full_name.toLowerCase().includes(filter.search.toLowerCase());
    return matchesPosition && matchesSearch;
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

  const { defenders, midfielders, forwards } = getFormationLayout(selectedFormation.layout);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Team</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Setup */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Formation</label>
            <select
              value={selectedFormation.layout}
              onChange={(e) => setSelectedFormation(formations.find(f => f.layout === e.target.value)!)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {formations.map(formation => (
                <option key={formation.layout} value={formation.layout}>
                  {formation.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Team Formation</h2>
            <div className="relative h-96 bg-green-800 rounded-lg overflow-hidden">
              <div className="absolute inset-0 border-2 border-white opacity-30"></div>
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Forwards */}
                <div className="flex justify-around">
                  {Array.from({ length: forwards }).map((_, index) => {
                    const position = `F${index + 1}`;
                    const player = selectedPlayers[position];
                    return (
                      <div
                        key={position}
                        onClick={() => player && handlePlayerRemove(position)}
                        className={`w-16 h-16 ${player ? 'bg-blue-500' : 'bg-white'} rounded-full flex items-center justify-center text-xs text-center cursor-pointer`}
                      >
                        {player ? (
                          <>
                            <div className="font-bold text-white">{player.full_name}</div>
                            <div className="text-blue-100">{player.rating}</div>
                          </>
                        ) : (
                          <div className="text-gray-400">F{index + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Midfielders */}
                <div className="flex justify-around">
                  {Array.from({ length: midfielders }).map((_, index) => {
                    const position = `M${index + 1}`;
                    const player = selectedPlayers[position];
                    return (
                      <div
                        key={position}
                        onClick={() => player && handlePlayerRemove(position)}
                        className={`w-16 h-16 ${player ? 'bg-blue-500' : 'bg-white'} rounded-full flex items-center justify-center text-xs text-center cursor-pointer`}
                      >
                        {player ? (
                          <>
                            <div className="font-bold text-white">{player.full_name}</div>
                            <div className="text-blue-100">{player.rating}</div>
                          </>
                        ) : (
                          <div className="text-gray-400">M{index + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Defenders */}
                <div className="flex justify-around">
                  {Array.from({ length: defenders }).map((_, index) => {
                    const position = `D${index + 1}`;
                    const player = selectedPlayers[position];
                    return (
                      <div
                        key={position}
                        onClick={() => player && handlePlayerRemove(position)}
                        className={`w-16 h-16 ${player ? 'bg-blue-500' : 'bg-white'} rounded-full flex items-center justify-center text-xs text-center cursor-pointer`}
                      >
                        {player ? (
                          <>
                            <div className="font-bold text-white">{player.full_name}</div>
                            <div className="text-blue-100">{player.rating}</div>
                          </>
                        ) : (
                          <div className="text-gray-400">D{index + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Goalkeeper */}
                <div className="flex justify-center">
                  <div
                    onClick={() => selectedPlayers.GK && handlePlayerRemove('GK')}
                    className={`w-16 h-16 ${selectedPlayers.GK ? 'bg-blue-500' : 'bg-white'} rounded-full flex items-center justify-center text-xs text-center cursor-pointer`}
                  >
                    {selectedPlayers.GK ? (
                      <>
                        <div className="font-bold text-white">{selectedPlayers.GK.full_name}</div>
                        <div className="text-blue-100">{selectedPlayers.GK.rating}</div>
                      </>
                    ) : (
                      <div className="text-gray-400">GK</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Budget</h2>
              <div className="text-sm">
                <span className="text-gray-500">Remaining: </span>
                <span className={`font-bold ${calculateRemainingBudget() < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ${calculateRemainingBudget().toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${(calculateTotalCost() / budget) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={handleCreateTeam}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Team
          </button>
        </div>

        {/* Player Selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Players</h2>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search players..."
                />
              </div>

              <div>
                <select
                  value={filter.position}
                  onChange={(e) => setFilter(prev => ({ ...prev, position: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ALL">All Positions</option>
                  <option value="GK">Goalkeeper</option>
                  <option value="DEF">Defender</option>
                  <option value="MID">Midfielder</option>
                  <option value="FWD">Forward</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => {
                    const position = player.position === 'GK' ? 'GK' :
                      player.position === 'DEF' ? 'D' + (Object.values(selectedPlayers).filter(p => p?.position === 'DEF').length + 1) :
                      player.position === 'MID' ? 'M' + (Object.values(selectedPlayers).filter(p => p?.position === 'MID').length + 1) :
                      'F' + (Object.values(selectedPlayers).filter(p => p?.position === 'FWD').length + 1);
                    handlePlayerSelect(position, player);
                  }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div>
                    <div className="font-medium">{player.full_name}</div>
                    <div className="text-sm text-gray-500">{player.team} • {player.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${player.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Rating: {player.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamPage; 