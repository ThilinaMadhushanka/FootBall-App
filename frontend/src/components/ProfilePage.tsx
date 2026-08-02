import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
} from '@mui/material';
import api from '../utils/api';
import { Mail, User, Phone, MapPin, Calendar, Briefcase, Ruler, Weight, Dribbble, Heart, Zap, Shield, Goal, Settings, LogOut } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  manager_id: number;
  founded_year: number;
  stadium: string;
  location: string;
  logo_url: string;
  budget: number;
  created_at: string;
}

interface Manager {
  id: number;
  username: string;
  email: string;
  full_name: string;
  team_name: string;
  created_at: string;
  team?: Team;
}

interface PlayerProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  position: string;
  age: number;
  nationality: string;
  current_team: Team | string | null;
  rating: number;
  price: number;
  salary: number;
  experience_years: number;
  height_cm: number;
  weight_kg: number;
  preferred_foot: string;
  bio: string;
  profile_image_url: string;
  is_available: boolean;
  games_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  created_at: string;
  last_login: string;
  jersey_number?: number;
}

type UserProfile = Manager | PlayerProfile;

const getTeamName = (team: Team | string | null | undefined): string => {
  if (!team) return '';
  return typeof team === 'string' ? team : team.name;
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  // State for editable fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState(''); // Manager specific
  const [position, setPosition] = useState(''); // Player specific
  const [age, setAge] = useState<number | ''>(''); // Player specific
  const [nationality, setNationality] = useState(''); // Player specific
  const [currentTeam, setCurrentTeam] = useState(''); // Player specific
  const [bio, setBio] = useState(''); // Player specific
  const [profileImageURL, setProfileImageURL] = useState(''); // Player specific
  const [isAvailable, setIsAvailable] = useState<boolean | ''>(''); // Player specific
  const [preferredFoot, setPreferredFoot] = useState(''); // Player specific
  const [rating, setRating] = useState<number | ''>(''); // Player specific
  const [price, setPrice] = useState<number | ''>(''); // Player specific
  const [experienceYears, setExperienceYears] = useState<number | ''>(''); // Player specific
  const [heightCm, setHeightCm] = useState<number | ''>(''); // Player specific
  const [weightKg, setWeightKg] = useState<number | ''>(''); // Player specific

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType');
    setUserType(storedUserType);

    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile');
        setProfile(response.data);
        // Initialize editable fields
        if (response.data) {
          setUsername(response.data.username);
          setEmail(response.data.email);
          setFullName(response.data.full_name);
          if (storedUserType === 'manager') {
            const managerProfile = response.data as Manager;
            setTeamName(managerProfile.team_name || '');
          } else if (storedUserType === 'player') {
            const playerProfile = response.data as PlayerProfile;
            setPosition(playerProfile.position || '');
            setAge(playerProfile.age || '');
            setNationality(playerProfile.nationality || '');
            setCurrentTeam(getTeamName(playerProfile.current_team));
            setBio(playerProfile.bio || '');
            setProfileImageURL(playerProfile.profile_image_url || '');
            setIsAvailable(playerProfile.is_available);
            setPreferredFoot(playerProfile.preferred_foot || '');
            setRating(playerProfile.rating || '');
            setPrice(playerProfile.price || '');
            setExperienceYears(playerProfile.experience_years || '');
            setHeightCm(playerProfile.height_cm || '');
            setWeightKg(playerProfile.weight_kg || '');
          }
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const updatedData: any = {
        username,
        email,
        full_name: fullName,
      };

      if (userType === 'manager') {
        updatedData.team_name = teamName;
      } else if (userType === 'player') {
        updatedData.position = position;
        updatedData.age = age;
        updatedData.nationality = nationality;
        updatedData.current_team = currentTeam;
        updatedData.bio = bio;
        updatedData.profile_image_url = profileImageURL;
        updatedData.is_available = isAvailable;
        updatedData.preferred_foot = preferredFoot;
        updatedData.rating = rating;
        updatedData.price = price;
        updatedData.experience_years = experienceYears;
        updatedData.height_cm = heightCm;
        updatedData.weight_kg = weightKg;
      }

      const response = await api.put('/profile', updatedData);
      setProfile(response.data); // Assuming backend sends back the updated profile

      // Update localStorage after successful update
      const updatedUser = { ...profile, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
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

  if (!profile) {
    return null;
  }

  const isPlayer = (profile: PlayerProfile | Manager): profile is PlayerProfile => {
    return (profile as PlayerProfile).position !== undefined;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-6 mb-6">
            <img
              src={isPlayer(profile) ? profile.profile_image_url : `https://ui-avatars.com/api/?name=${profile.full_name.replace(/ /g, '+')}&background=random&color=fff&size=128`}
              alt={profile.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.full_name}</h2>
              <p className="text-lg text-gray-600">@{profile.username}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-1" /> {profile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
            <div>
              <p className="text-sm text-gray-500 flex items-center"><User className="w-4 h-4 mr-2" /> Username</p>
              <p className="font-medium">{profile.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Account Type</p>
              <p className="font-medium">{isPlayer(profile) ? 'Player' : 'Manager'}</p>
            </div>
            {isPlayer(profile) && (
              <>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Dribbble className="w-4 h-4 mr-2" /> Position</p>
                  <p className="font-medium">{profile.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Heart className="w-4 h-4 mr-2" /> Rating</p>
                  <p className="font-medium">{profile.rating}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Zap className="w-4 h-4 mr-2" /> Current Team</p>
                  <p className="font-medium">{getTeamName(profile.current_team) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Phone className="w-4 h-4 mr-2" /> Price</p>
                  <p className="font-medium">₹{profile.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Age</p>
                  <p className="font-medium">{profile.age}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Nationality</p>
                  <p className="font-medium">{profile.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Experience</p>
                  <p className="font-medium">{profile.experience_years} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Ruler className="w-4 h-4 mr-2" /> Height</p>
                  <p className="font-medium">{profile.height_cm} cm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Weight className="w-4 h-4 mr-2" /> Weight</p>
                  <p className="font-medium">{profile.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Dribbble className="w-4 h-4 mr-2" /> Preferred Foot</p>
                  <p className="font-medium">{profile.preferred_foot}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Shield className="w-4 h-4 mr-2" /> Jersey Number</p>
                  <p className="font-medium">{profile.jersey_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center"><Goal className="w-4 h-4 mr-2" /> Salary</p>
                  <p className="font-medium">₹{profile.salary}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 flex items-center"><User className="w-4 h-4 mr-2" /> Bio</p>
                  <p className="font-medium">{profile.bio || 'N/A'}</p>
                </div>
              </>
            )}

            {!isPlayer(profile) && (
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Zap className="w-4 h-4 mr-2" /> Managed Team</p>
                <p className="font-medium">{profile.team_name || 'N/A'}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Member Since</p>
              <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>

            {isPlayer(profile) && (
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Last Login</p>
                <p className="font-medium">{new Date(profile.last_login).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isPlayer(profile) && (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Player Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-gray-700">
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Dribbble className="w-4 h-4 mr-2" /> Games Played</p>
                <p className="font-medium">{profile.games_played}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Goal className="w-4 h-4 mr-2" /> Goals</p>
                <p className="font-medium">{profile.goals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Heart className="w-4 h-4 mr-2" /> Assists</p>
                <p className="font-medium">{profile.assists}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Settings className="w-4 h-4 mr-2" /> Yellow Cards</p>
                <p className="font-medium">{profile.yellow_cards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Settings className="w-4 h-4 mr-2" /> Red Cards</p>
                <p className="font-medium">{profile.red_cards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center"><Shield className="w-4 h-4 mr-2" /> Clean Sheets</p>
                <p className="font-medium">{profile.clean_sheets}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleUpdateProfile} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="mb-5"><h2 className="text-xl font-black text-slate-900">Edit Profile</h2><p className="text-sm text-slate-500">Update your public account information.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <label><span className="auth-label">Username</span><input className="auth-input" value={username} onChange={event => setUsername(event.target.value)} required /></label>
            <label><span className="auth-label">Email</span><input className="auth-input" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
            <label><span className="auth-label">Full Name</span><input className="auth-input" value={fullName} onChange={event => setFullName(event.target.value)} required /></label>
            {userType === 'manager' ? <label><span className="auth-label">Team Name</span><input className="auth-input" value={teamName} onChange={event => setTeamName(event.target.value)} /></label> : <>
              <label><span className="auth-label">Position</span><select className="auth-input" value={position} onChange={event => setPosition(event.target.value)}><option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option></select></label>
              <label><span className="auth-label">Age</span><input className="auth-input" type="number" value={age} onChange={event => setAge(Number(event.target.value))} /></label>
              <label><span className="auth-label">Nationality</span><input className="auth-input" value={nationality} onChange={event => setNationality(event.target.value)} /></label>
              <label><span className="auth-label">Preferred Foot</span><select className="auth-input" value={preferredFoot} onChange={event => setPreferredFoot(event.target.value)}><option value="Left">Left</option><option value="Right">Right</option><option value="Both">Both</option></select></label>
              <label><span className="auth-label">Height (cm)</span><input className="auth-input" type="number" value={heightCm} onChange={event => setHeightCm(Number(event.target.value))} /></label>
              <label><span className="auth-label">Weight (kg)</span><input className="auth-input" type="number" value={weightKg} onChange={event => setWeightKg(Number(event.target.value))} /></label>
              <label className="md:col-span-2"><span className="auth-label">Profile Image URL</span><input className="auth-input" value={profileImageURL} onChange={event => setProfileImageURL(event.target.value)} /></label>
              <label className="md:col-span-2"><span className="auth-label">Bio</span><textarea className="auth-input" rows={3} value={bio} onChange={event => setBio(event.target.value)} /></label>
              <label className="flex items-center gap-3 md:col-span-2"><input type="checkbox" checked={Boolean(isAvailable)} onChange={event => setIsAvailable(event.target.checked)} className="h-4 w-4" /><span className="text-sm font-semibold text-slate-700">Available for invitations and transfer requests</span></label>
            </>}
          </div>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600">Cancel</button><button type="submit" className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400">Save Changes</button></div>
        </form>
      )}

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setIsEditing(value => !value)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Settings className="w-5 h-5 mr-2" /> Edit Profile
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            window.location.href = '/login/manager';
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage; 
