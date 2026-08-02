import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create a single axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling and data transformation
api.interceptors.response.use(
  (response) => {
    // Transform the response data to handle NULL values
    const transformData = (data: unknown): unknown => {
      if (!data) return data;
      
      if (Array.isArray(data)) {
        return data.map(item => transformData(item));
      }
      
      if (typeof data === 'object' && data !== null) {
        const transformed = { ...data as Record<string, unknown> };
        if ('height_cm' in transformed) {
          transformed.height_cm = transformed.height_cm ?? 0;
        }
        if ('weight_kg' in transformed) {
          transformed.weight_kg = transformed.weight_kg ?? 0;
        }
        return transformed;
      }
      
      return data;
    };

    response.data = transformData(response.data);
    return response;
  },
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isLoginRequest = requestUrl.startsWith('/login/');

    // A 401 from a protected page means the session expired. A 401 from the
    // login form only means the supplied credentials were invalid; reloading
    // that page would immediately erase its useful error message.
    if (error.response?.status === 401 && !isLoginRequest) {
      const previousUserType = localStorage.getItem('userType');
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('user');
      const loginRole = previousUserType === 'player' || previousUserType === 'viewer' || previousUserType === 'organizer' ? previousUserType : 'manager';
      window.location.href = `/login/${loginRole}`;
    }
    return Promise.reject(error);
  }
);

// Export the api instance
export default api;

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
  player?: { full_name?: string; username?: string };
  team: string | { name?: string } | null;
  minute: number;
  description: string;
  created_at: string;
}

// API functions
export const getPlayerStats = async (playerId: number): Promise<PlayerStats> => {
  const response = await api.get(`/players/${playerId}/stats`);
  return response.data;
};

export const updatePlayerStats = async (playerId: number, stats: Partial<PlayerStats>): Promise<void> => {
  await api.put(`/players/${playerId}/stats`, stats);
};

export const getMatchEvents = async (matchId: number): Promise<MatchEvent[]> => {
  const response = await api.get(`/matches/${matchId}/events`);
  return response.data;
};

export const addMatchEvent = async (event: Omit<MatchEvent, 'id' | 'created_at'>): Promise<MatchEvent> => {
  const response = await api.post(`/matches/${event.match_id}/events`, event);
  return response.data;
};

export const updateLeaderboard = async (): Promise<void> => {
  await api.post(`/leaderboard/update`);
};

export const login = async (username: string, password: string, userType: 'manager' | 'player'): Promise<{ token: string }> => {
  const response = await api.post(`/login/${userType}`, { username, password });
  return response.data;
};

export const register = async (data: any, userType: 'manager' | 'player'): Promise<void> => {
  await api.post(`/register/${userType}`, data);
};

export const getAllPlayers = async (): Promise<any[]> => {
  const response = await api.get(`/players`);
  return response.data;
};

export const getUpcomingMatches = async (): Promise<any[]> => {
  const response = await api.get(`/matches/upcoming`);
  return response.data;
};

export const getDashboardStats = async (): Promise<any> => {
  const response = await api.get(`/dashboard/stats`);
  return response.data;
};

export const addPlayerToTeam = async (playerId: number, position: string): Promise<void> => {
  await api.post(`/team/add-player`, { player_id: playerId, position });
};
