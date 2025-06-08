import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Types
export interface PlayerStats {
  player_id: number;
  games_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  minutes_played: number;
  pass_accuracy: number;
  shots_on_target: number;
  last_updated: string;
}

export interface MatchEvent {
  id: number;
  match_id: number;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'injury';
  player_id: number;
  team: string;
  minute: number;
  description: string;
  created_at: string;
}

// API functions
export const getPlayerStats = async (playerId: number): Promise<PlayerStats> => {
  const response = await axios.get(`${API_BASE_URL}/players/${playerId}/stats`);
  return response.data;
};

export const updatePlayerStats = async (playerId: number, stats: Partial<PlayerStats>): Promise<void> => {
  await axios.put(`${API_BASE_URL}/players/${playerId}/stats`, stats);
};

export const getMatchEvents = async (matchId: number): Promise<MatchEvent[]> => {
  const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/events`);
  return response.data;
};

export const addMatchEvent = async (event: Omit<MatchEvent, 'id' | 'created_at'>): Promise<MatchEvent> => {
  const response = await axios.post(`${API_BASE_URL}/matches/events`, event);
  return response.data;
};

export const updateLeaderboard = async (): Promise<void> => {
  await axios.post(`${API_BASE_URL}/leaderboard/update`);
};

// Existing API functions
export const login = async (username: string, password: string, userType: 'manager' | 'player'): Promise<{ token: string }> => {
  const response = await axios.post(`${API_BASE_URL}/login/${userType}`, { username, password });
  return response.data;
};

export const register = async (data: any, userType: 'manager' | 'player'): Promise<void> => {
  await axios.post(`${API_BASE_URL}/register/${userType}`, data);
};

export const getAllPlayers = async (): Promise<any[]> => {
  const response = await axios.get(`${API_BASE_URL}/players`);
  return response.data;
};

export const getUpcomingMatches = async (): Promise<any[]> => {
  const response = await axios.get(`${API_BASE_URL}/matches/upcoming`);
  return response.data;
};

export const getDashboardStats = async (): Promise<any> => {
  const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
  return response.data;
};

export const addPlayerToTeam = async (playerId: number, position: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/team/add-player`, { player_id: playerId, position });
};

// Axios interceptor for authentication
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login/manager';
    }
    return Promise.reject(error);
  }
); 