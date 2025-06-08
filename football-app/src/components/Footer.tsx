import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <div className="bg-blue-900 text-white p-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">PlayerPro</h3>
          <p className="text-sm">The ultimate platform for creating and managing your fantasy sports teams.</p>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Quick Links</h3>
          <ul className="text-sm space-y-2">
            <li><Link to="/home" className="hover:underline">Home</Link></li>
            <li><Link to="/rules-and-scoring" className="hover:underline">Rules & Scoring</Link></li>
            <li><Link to="/players" className="hover:underline">Player Statistics</Link></li>
            <li><Link to="/fixtures" className="hover:underline">Fixtures</Link></li>
            <li><Link to="/help-center" className="hover:underline">Help Center</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Connect With Us</h3>
          <div className="flex space-x-4 mb-4">
            <a href="#" className="hover:text-gray-300"><img src="https://via.placeholder.com/24/ffffff/000000?text=FB" alt="Facebook" /></a>
            <a href="#" className="hover:text-gray-300"><img src="https://via.placeholder.com/24/ffffff/000000?text=TW" alt="Twitter" /></a>
            <a href="#" className="hover:text-gray-300"><img src="https://via.placeholder.com/24/ffffff/000000?text=IG" alt="Instagram" /></a>
          </div>
          <p className="text-sm">Contact: support@playerpro.com</p>
        </div>
      </div>
    </div>
  );
};

export default Footer; 