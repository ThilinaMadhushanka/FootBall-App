import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, ChevronDown, Search } from 'lucide-react';

interface UserData {
  full_name: string;
}

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<UserData | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setLoggedInUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/home">
          <img src="/logo.svg" alt="PlayerPro Logo" className="h-8" />
        </Link>
        <h1 className="text-xl font-bold">PlayerPro</h1>
        <nav className="hidden md:flex space-x-4">
          <Link to="/home" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/players" className="hover:text-gray-300">Players</Link>
          <Link to="/fixtures" className="hover:text-gray-300">Fixtures</Link>
          <Link to="/settings" className="hover:text-gray-300">Settings</Link>
        </nav>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search for players, teams, or leagues..."
          className="bg-blue-700 text-white placeholder-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"
          size={20}
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-blue-700 rounded-full">
          <Bell size={20} />
        </button>
        <div className="relative">
          <button 
            className="flex items-center space-x-2 p-1 rounded hover:bg-blue-600"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <User size={16} />
            </div>
            <span>{loggedInUser ? loggedInUser.full_name : 'Guest'}</span>
            <ChevronDown size={16} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 text-gray-800">
              <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
              <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">Settings</Link>
              <Link to="/my-teams" className="block px-4 py-2 hover:bg-gray-100">My Teams</Link>
              <div className="border-t border-gray-200"></div>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header; 