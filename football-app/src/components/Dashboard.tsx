import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { Award, Users, Clock, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Player {
  id: number;
  name: string;
  position: string;
  rating: number;
  price: number;
  team: string;
  image: string;
}

interface Match {
  id: number;
  team1: string;
  team2: string;
  date: string;
  time: string;
}

interface DashboardStats {
  team_members: string;
  remaining_budget: number;
  league_rank: number;
  total_points: number;
}

const Dashboard: React.FC = () => {
  const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    team_members: '0/11',
    remaining_budget: 0,
    league_rank: 0,
    total_points: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch players
        const playersResponse = await apiService.get('/players');
        setFeaturedPlayers(playersResponse.data.slice(0, 3).map((player: any) => ({
          id: player.id,
          name: player.full_name,
          position: player.position,
          rating: player.rating,
          price: player.price,
          team: player.current_team,
          image: player.profile_image_url || '/api/placeholder/80/80'
        })));

        // Fetch matches
        const matchesResponse = await apiService.get('/matches');
        setUpcomingMatches(matchesResponse.data.slice(0, 2).map((match: any) => ({
          id: match.id,
          team1: match.team1,
          team2: match.team2,
          date: match.match_date,
          time: match.match_time
        })));

        // Fetch dashboard stats
        const statsResponse = await apiService.get('/dashboard/stats');
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSaveTeam = () => {
    console.log("Save Team button clicked!");
    // Future: Implement save team logic here
  };

  const handleAutoComplete = () => {
    console.log("Auto-Complete button clicked!");
    // Future: Implement auto-complete logic here
  };

  const handleAddPlayer = (index: number) => {
    console.log(`Add Player button clicked for slot ${index + 1}!`);
    // Future: Implement add player logic here
  };

  return (
    <div className="container mx-auto p-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Team Members</p>
            <p className="text-xl font-bold">{stats.team_members}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Remaining Budget</p>
            <p className="text-xl font-bold">₹{stats.remaining_budget}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">League Rank</p>
            <p className="text-xl font-bold">#{stats.league_rank}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Points</p>
            <p className="text-xl font-bold">{stats.total_points}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Featured Players */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Featured Players</h2>
              <Link to="/players" className="text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPlayers.map(player => (
                <div key={player.id} className="flex items-center space-x-4 p-2 rounded-lg border border-gray-200">
                  <img src={player.image} alt={player.name} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <p className="font-bold">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.position} - {player.team}</p>
                    <p className="text-sm text-gray-800">Rating: {player.rating}</p>
                    <p className="text-sm text-green-600">₹{player.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-green-700"
                onClick={handleSaveTeam}
              >
                Save Team
              </button>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={handleAutoComplete}
              >
                Auto-Complete
              </button>
            </div>
          </div>

          {/* My Team */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Team</h2>
              <div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-green-700">Save Team</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Auto-Complete</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[...Array(9)].map((_, index) => (
                <div 
                  key={index} 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-32 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => handleAddPlayer(index)}
                >
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 14c-1.474 0-2.836.278-4 .775V21h8v-6.225c-1.164-.497-2.526-.775-4-.775z" />
                  </svg>
                  <p className="text-sm text-gray-500">Add Player</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Upcoming Matches */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upcoming Matches</h2>
              <Link to="/fixtures" className="text-blue-600 hover:underline">View Calendar</Link>
            </div>
            <div className="space-y-4">
              {upcomingMatches.map(match => (
                <div key={match.id} className="border border-gray-200 p-3 rounded-lg">
                  <p className="font-bold">{match.team1} vs {match.team2}</p>
                  <p className="text-sm text-gray-600">{match.date} at {match.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Leaderboard */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Top Leaderboard</h2>
              <Link to="/leaderboard" className="text-blue-600 hover:underline">Full Rankings</Link>
            </div>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-yellow-500">1</span>
                  <img src="https://via.placeholder.com/30" alt="Alex Thompson" className="rounded-full" />
                  <span>Alex Thompson</span>
                </div>
                <span className="font-bold">587</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-gray-400">2</span>
                  <img src="https://via.placeholder.com/30" alt="Maria Garcia" className="rounded-full" />
                  <span>Maria Garcia</span>
                </div>
                <span className="font-bold">562</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-orange-400">3</span>
                  <img src="https://via.placeholder.com/30" alt="James Wilson" className="rounded-full" />
                  <span>James Wilson</span>
                </div>
                <span className="font-bold">540</span>
              </li>
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div>
                  <p>You transferred David Silva to your team</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <p>You earned 24 points in Gameweek 23</p>
                  <p className="text-sm text-gray-500">1 day ago</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p>System maintenance scheduled for Mar 10</p>
                  <p className="text-sm text-gray-500">2 days ago</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 