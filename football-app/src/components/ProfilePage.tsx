import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface ManagerProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  team_name: string;
  created_at: string;
  total_teams: number;
  total_points: number;
  rank: number;
  teams: {
    id: number;
    team_name: string;
    formation: string;
    total_rating: number;
    points: number;
  }[];
  recent_activity: {
    id: number;
    type: string;
    description: string;
    created_at: string;
  }[];
}

interface PlayerProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  position: string;
  age: number;
  nationality: string;
  current_team: string;
  rating: number;
  price: number;
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
}

type UserProfile = ManagerProfile | PlayerProfile;

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
        const response = await apiService.get('/api/profile');
        setProfile(response.data);
        // Initialize editable fields
        if (response.data) {
          setUsername(response.data.username);
          setEmail(response.data.email);
          setFullName(response.data.full_name);
          if (storedUserType === 'manager') {
            const managerProfile = response.data as ManagerProfile;
            setTeamName(managerProfile.team_name || '');
          } else if (storedUserType === 'player') {
            const playerProfile = response.data as PlayerProfile;
            setPosition(playerProfile.position || '');
            setAge(playerProfile.age || '');
            setNationality(playerProfile.nationality || '');
            setCurrentTeam(playerProfile.current_team || '');
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

      const response = await apiService.put('/api/profile', updatedData);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{profile.full_name}</h1>
              <p className="text-gray-500">{profile.email}</p>
              <p className="text-sm text-gray-400">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              {userType === 'manager' && (
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">Team Name</label>
                  <input
                    type="text"
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {userType === 'player' && (
                <>
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      type="number"
                      id="age"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
                    <input
                      type="text"
                      id="nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="currentTeam" className="block text-sm font-medium text-gray-700">Current Team</label>
                    <input
                      type="text"
                      id="currentTeam"
                      value={currentTeam}
                      onChange={(e) => setCurrentTeam(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="profileImageURL" className="block text-sm font-medium text-gray-700">Profile Image URL</label>
                    <input
                      type="text"
                      id="profileImageURL"
                      value={profileImageURL}
                      onChange={(e) => setProfileImageURL(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="isAvailable"
                      name="isAvailable"
                      type="checkbox"
                      checked={isAvailable === true}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                      Is Available
                    </label>
                  </div>
                  <div>
                    <label htmlFor="preferredFoot" className="block text-sm font-medium text-gray-700">Preferred Foot</label>
                    <select
                      id="preferredFoot"
                      value={preferredFoot}
                      onChange={(e) => setPreferredFoot(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Rating</label>
                    <input
                      type="number"
                      id="rating"
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">Experience Years</label>
                    <input
                      type="number"
                      id="experienceYears"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      id="heightCm"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input
                      type="number"
                      id="weightKg"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseInt(e.target.value) || '')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Stats Overview</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Points</span>
                    <span className="text-2xl font-bold text-blue-500">{((profile as ManagerProfile)?.total_points ?? 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rank</span>
                    <span className="text-2xl font-bold text-gray-800">#{(profile as ManagerProfile)?.rank ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Teams</span>
                    <span className="text-2xl font-bold text-gray-800">{(profile as ManagerProfile)?.total_teams ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {userType === 'manager' && (profile as ManagerProfile)?.recent_activity && (profile as ManagerProfile).recent_activity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'TEAM_CREATED' ? 'bg-green-500' :
                        activity.type === 'MATCH_PLAYED' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="text-sm text-gray-800">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">My Teams</h2>
                <div className="space-y-4">
                  {userType === 'manager' && (profile as ManagerProfile)?.teams && (profile as ManagerProfile).teams.map(team => (
                    <div key={team.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-gray-800">{team.team_name}</h3>
                          <p className="text-sm text-gray-500">Formation: {team.formation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-500">{team.points} pts</p>
                          <p className="text-sm text-gray-500">Rating: {team.total_rating}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 