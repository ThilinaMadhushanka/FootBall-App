import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '../../utils/api';

interface RegisterProps {
  userType?: string;
}

const Register: React.FC<RegisterProps> = () => {
  const { userType = 'viewer' } = useParams<{ userType: 'manager' | 'player' | 'viewer' | 'organizer' }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    teamName: '',
    teamID: '',
    position: '',
    age: '',
    nationality: '',
    currentTeam: '',
    experienceYears: '',
    heightCm: '',
    weightKg: '',
    preferredFoot: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [createNewTeam, setCreateNewTeam] = useState(false);

  const roleContent = {
    manager: { brandLabel: 'Team Manager', eyebrow: 'Manager registration', title: 'Create a team. Build a legacy.', description: 'Set up your manager identity, create your club and begin recruiting a squad.' },
    player: { brandLabel: 'Player Centre', eyebrow: 'Player registration', title: 'Start your football journey.', description: 'Create a complete player profile, track your performance and receive team opportunities.' },
    viewer: { brandLabel: 'Match Viewer', eyebrow: 'Viewer registration', title: 'Follow every moment.', description: 'Create a read-only fan account to explore live matches, players, teams and league performance.' },
    organizer: { brandLabel: 'Competition Hub', eyebrow: 'Organizer registration', title: 'Create the next competition.', description: 'Set up an organizer account to create leagues, seasons and manage participating teams.' }
  }[userType];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (userType !== 'manager') return;
    api.get('/teams/available').then(response => setAvailableTeams(Array.isArray(response.data) ? response.data : [])).catch(() => setAvailableTeams([]));
  }, [userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = `/register/${userType}`;
      const data = userType === 'manager' 
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            full_name: formData.fullName,
            team_name: createNewTeam ? formData.teamName : '',
            team_id: createNewTeam ? null : Number(formData.teamID),
          }
        : userType === 'player' ? {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            full_name: formData.fullName,
            position: formData.position,
            age: parseInt(formData.age),
            nationality: formData.nationality,
            current_team: formData.currentTeam,
            experience_years: parseInt(formData.experienceYears),
            height_cm: parseInt(formData.heightCm),
            weight_kg: parseInt(formData.weightKg),
            preferred_foot: formData.preferredFoot,
            bio: formData.bio,
          } : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            full_name: formData.fullName,
          };

      const response = await api.post(endpoint, data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', userType || 'manager');
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('auth-changed'));

      navigate(userType === 'organizer' ? '/competition-admin' : '/home');
    } catch (err: any) {
      // Clear any existing timeout
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }

      // Set a more specific error message based on the error type
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            if (err.response.data === 'Required fields are missing') {
              errorMessage = 'Please fill in all required fields.';
            } else if (err.response.data === 'Invalid numeric values') {
              errorMessage = 'Please enter valid numbers for age, height, weight, and experience.';
            } else {
              errorMessage = 'Please check your input data and try again.';
            }
            break;
          case 409:
            if (err.response.data === 'Username already exists') {
              errorMessage = 'This username is already taken. Please choose another one.';
            } else if (err.response.data === 'Email already exists') {
              errorMessage = 'This email is already registered. Please use a different email.';
            }
            break;
          case 422:
            errorMessage = 'Invalid data provided. Please check your input.';
            break;
          default:
            errorMessage = 'An error occurred during registration. Please try again.';
        }
      }

      setError(errorMessage);

      // Set a new timeout to clear the error after 5 seconds
      const timeout = setTimeout(() => {
        setError('');
      }, 50000);
      setErrorTimeout(timeout);
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [errorTimeout]);

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[minmax(300px,0.72fr)_minmax(620px,1.28fr)]">
      <section className="auth-showcase min-h-[340px] lg:flex">
        <div className="relative z-10 max-w-lg">
          <Link to="/login/manager" className="mb-12 flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-12 w-12" />
            <div><p className="text-xl font-extrabold">PlayerPro</p><p className="text-xs uppercase tracking-[0.22em] text-emerald-300">{roleContent.brandLabel}</p></div>
          </Link>
          <Sparkles className="mb-5 text-emerald-300" />
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">{roleContent.eyebrow}</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight">{roleContent.title}</h1>
          <p className="mt-5 leading-7 text-slate-300">{roleContent.description}</p>
        </div>
      </section>

      <section className="flex items-start justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
        <div>
          <p className="text-sm font-bold text-emerald-600">Join PlayerPro</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Create your {userType} account
          </h2>
          <p className="mt-2 text-sm text-slate-500">Enter your details below to get started.</p>
        </div>

        <div className="mt-7 grid grid-cols-4 rounded-xl bg-slate-100 p-1">
          {(['manager', 'player', 'viewer', 'organizer'] as const).map(type => (
            <Link key={type} to={`/register/${type}`} className={`rounded-lg px-4 py-2.5 text-center text-sm font-bold capitalize transition ${userType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{type}</Link>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Common fields */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="auth-input"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="auth-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="auth-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="auth-input"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            {/* Manager-specific fields */}
            {userType === 'manager' && (
              <div className="space-y-3 sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <input type="checkbox" checked={createNewTeam} onChange={event => { setCreateNewTeam(event.target.checked); setFormData(previous => ({...previous, teamID:'', teamName:''})); }} className="h-4 w-4 accent-emerald-500" />
                  <span><strong className="block text-sm text-slate-800">Create a new team</strong><span className="text-xs text-slate-500">Untick this to select a team registered by an organizer.</span></span>
                </label>
                {createNewTeam ? (
                  <label><span className="auth-label">New team name</span><input id="teamName" name="teamName" type="text" required className="auth-input" value={formData.teamName} onChange={handleChange} placeholder="Enter a unique team name" /></label>
                ) : (
                  <label><span className="auth-label">Select an available team</span><select id="teamID" name="teamID" required className="auth-input" value={formData.teamID} onChange={handleChange}><option value="">Choose a team</option>{availableTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>{availableTeams.length === 0 && <span className="mt-2 block text-xs text-amber-600">No organizer-created teams are available. Select “Create a new team”.</span>}</label>
                )}
              </div>
            )}

            {/* Player-specific fields */}
            {userType === 'player' && (
              <>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <select
                    id="position"
                    name="position"
                    required
                    className="auth-input"
                    value={formData.position}
                    onChange={handleChange}
                  >
                    <option value="">Select Position</option>
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    className="auth-input"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                    Nationality
                  </label>
                  <input
                    id="nationality"
                    name="nationality"
                    type="text"
                    required
                    className="auth-input"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="currentTeam" className="block text-sm font-medium text-gray-700">
                    Current Team
                  </label>
                  <input
                    id="currentTeam"
                    name="currentTeam"
                    type="text"
                    className="auth-input"
                    value={formData.currentTeam}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    required
                    className="auth-input"
                    value={formData.experienceYears}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700">
                    Height (cm)
                  </label>
                  <input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    required
                    className="auth-input"
                    value={formData.heightCm}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    required
                    className="auth-input"
                    value={formData.weightKg}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="preferredFoot" className="block text-sm font-medium text-gray-700">
                    Preferred Foot
                  </label>
                  <select
                    id="preferredFoot"
                    name="preferredFoot"
                    required
                    className="auth-input"
                    value={formData.preferredFoot}
                    onChange={handleChange}
                  >
                    <option value="">Select Preferred Foot</option>
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="auth-input"
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-emerald-600"
            >
              Register
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to={`/login/${userType}`}
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
      </section>
    </main>
  );
};

export default Register; 
