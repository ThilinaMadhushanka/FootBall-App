import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './components/Home';
import PlayersPage from './components/PlayersPage';
import FixturesPage from './components/FixturesPage';
import SettingsPage from './components/SettingsPage';
import MyTeamsPage from './components/MyTeamsPage';
import RulesAndScoringPage from './components/RulesAndScoringPage';
import HelpCenterPage from './components/HelpCenterPage';
import ProfilePage from './components/ProfilePage';
import LeaderboardPage from './components/LeaderboardPage';
import PlayerStatsComponent from './components/PlayerStats';
import MatchEventsComponent from './components/MatchEvents';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login/manager" />} />
        <Route path="/login/:userType" element={<Login />} />
        <Route path="/register/:userType" element={<Register />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Home />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/players" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PlayersPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/players/:id/stats" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <PlayerStatsComponent />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fixtures" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <FixturesPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/matches/:id/events" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <MatchEventsComponent />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-teams" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <MyTeamsPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rules-and-scoring" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <RulesAndScoringPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/help-center" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <HelpCenterPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <LeaderboardPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
