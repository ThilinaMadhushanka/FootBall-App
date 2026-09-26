import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import api from '../utils/api';

const ManagerDashboard = () => {
  const [teamData, setTeamData] = useState({
    name: '',
    manager: '',
    budget: 0,
    players: [],
    upcomingMatches: [],
    stats: {
      leagueRank: 0,
      points: 0,
      gamesWon: 0,
      gamesDrawn: 0,
      gamesLost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
  });

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Get user ID from token or local storage
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.error('User data not found');
          return;
        }

        const { id: userId } = JSON.parse(userData);
        if (!userId) {
          console.error('Invalid user ID');
          return;
        }

        // Fetch team data
        const teamResponse = await api.get('/teams/my-teams');
        const team = teamResponse.data;

        if (team) {
          setTeamData({
            name: team.name || team.team_name || '',
            manager: team.manager?.full_name || '',
            budget: team.budget || 0,
            players: team.players || [],
            upcomingMatches: team.upcomingMatches || [],
            stats: {
              leagueRank: team.stats?.leagueRank || 0,
              points: team.stats?.points || 0,
              gamesWon: team.stats?.gamesWon || 0,
              gamesDrawn: team.stats?.gamesDrawn || 0,
              gamesLost: team.stats?.gamesLost || 0,
              goalsFor: team.stats?.goalsFor || 0,
              goalsAgainst: team.stats?.goalsAgainst || 0,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };

    fetchTeamData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Team Overview Card */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              {teamData.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manager: {teamData.manager}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Budget: ${(teamData.budget / 1000000).toFixed(2)}M
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              League Position: #{teamData.stats.leagueRank}
            </Typography>
            <Typography variant="body1">
              Points: {teamData.stats.points}
            </Typography>
            <Typography variant="body1">
              W/D/L: {teamData.stats.gamesWon}/{teamData.stats.gamesDrawn}/{teamData.stats.gamesLost}
            </Typography>
            <Typography variant="body1">
              Goals: {teamData.stats.goalsFor}/{teamData.stats.goalsAgainst}
            </Typography>
          </Paper>
        </Grid>

        {/* Players Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Squad
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Salary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamData.players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.jerseyNumber}</TableCell>
                      <TableCell>{player.name || player.full_name}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{player.rating}</TableCell>
                      <TableCell>${(player.salary / 1000).toFixed(1)}k</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Upcoming Matches */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Matches
            </Typography>
            <Grid container spacing={2}>
              {teamData.upcomingMatches.map((match) => (
                <Grid item xs={12} sm={6} md={4} key={match.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        vs {match.opponent}
                      </Typography>
                      <Typography color="text.secondary">
                        {match.date} at {match.time}
                      </Typography>
                      <Typography variant="body2">
                        Venue: {match.venue}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ManagerDashboard; 
