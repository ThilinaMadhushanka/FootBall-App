import React from 'react';

const RulesAndScoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Rules & Scoring</h1>

        <div className="space-y-8">
          {/* Game Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Overview</h2>
            <p className="text-gray-600 mb-4">
              PlayerPro is a fantasy football game where you create and manage your own teams, compete against other managers,
              and earn points based on your players' real-world performances.
            </p>
          </div>

          {/* Team Creation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Creation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Budget</h3>
                <p className="text-gray-600">
                  Each manager starts with a budget of $1,000,000 to build their team. Choose your players wisely!
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Formation</h3>
                <p className="text-gray-600">
                  Select from various formations (4-4-2, 4-3-3, 3-5-2, 5-3-2) to suit your tactical preferences.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Squad Requirements</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Exactly 11 players must be selected</li>
                  <li>One goalkeeper</li>
                  <li>At least 3 defenders</li>
                  <li>At least 2 midfielders</li>
                  <li>At least 1 forward</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scoring System */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Scoring System</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Goalkeepers & Defenders</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Clean Sheet: +4 points</li>
                  <li>Goal Scored: +6 points</li>
                  <li>Assist: +3 points</li>
                  <li>Save: +1 point (Goalkeepers only)</li>
                  <li>Penalty Save: +5 points (Goalkeepers only)</li>
                  <li>Goal Conceded: -1 point</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Midfielders</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Goal Scored: +5 points</li>
                  <li>Assist: +3 points</li>
                  <li>Clean Sheet: +1 point</li>
                  <li>Goal Conceded: -1 point</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Forwards</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Goal Scored: +4 points</li>
                  <li>Assist: +3 points</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">All Players</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Yellow Card: -1 point</li>
                  <li>Red Card: -3 points</li>
                  <li>Own Goal: -2 points</li>
                  <li>Penalty Miss: -2 points</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Match Rules */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Rules</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Weekly Matches</h3>
                <p className="text-gray-600">
                  Your team will automatically compete in weekly matches against other managers' teams.
                  Points are calculated based on your players' real-world performances.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Transfers</h3>
                <p className="text-gray-600">
                  You can make up to 2 free transfers per week. Additional transfers will cost points.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Captain Selection</h3>
                <p className="text-gray-600">
                  Choose a captain for each match. Your captain's points will be doubled.
                </p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Leaderboard</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Compete with other managers on the global leaderboard. Your ranking is determined by:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Total points accumulated</li>
                <li>Number of wins</li>
                <li>Goal difference</li>
                <li>Goals scored</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesAndScoringPage; 