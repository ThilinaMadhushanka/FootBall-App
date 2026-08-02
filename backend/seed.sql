-- Insert example managers with password hashes
INSERT INTO managers (username, email, full_name, team_name, password_hash) VALUES
('alex_ferguson', 'alex@manutd.com', 'Alex Ferguson', 'Manchester United', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC'),  -- password: password
('pep_guardiola', 'pep@mancity.com', 'Pep Guardiola', 'Manchester City', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC'),   -- password: password
('jurgen_klopp', 'jurgen@liverpool.com', 'Jurgen Klopp', 'Liverpool FC', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC');    -- password: password

-- Insert example teams
INSERT INTO teams (name, manager_id, founded_year, stadium, location, logo_url, budget, formation) VALUES
('Manchester United', 1, 1878, 'Old Trafford', 'Manchester', '', 500000000.00, '4-2-3-1'),
('Manchester City', 2, 1880, 'Etihad Stadium', 'Manchester', '', 600000000.00, '4-3-3'),
('Liverpool FC', 3, 1892, 'Anfield', 'Liverpool', '', 450000000.00, '4-3-3');

-- Insert example players
INSERT INTO players (username, email, password_hash, full_name, position, age, nationality, current_team_id, rating, price, salary, jersey_number, is_available, games_played, goals, assists) VALUES
('marcus_rashford', 'marcus@manutd.com', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC', 'Marcus Rashford', 'Forward', 28, 'England', 1, 85.50, 80000000.00, 200000.00, 10, true, 2, 3, 0),
('kevin_debruyne', 'kevin@mancity.com', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC', 'Kevin De Bruyne', 'Midfielder', 35, 'Belgium', 2, 91.00, 120000000.00, 350000.00, 17, true, 2, 4, 1),
('mohamed_salah', 'mo@liverpool.com', '$2a$10$a3DuQRIBW.q30RwpzGJCC.R7ozR9YaO68RbyIr0MSRkziGgggaLuC', 'Mohamed Salah', 'Forward', 34, 'Egypt', 3, 89.75, 100000000.00, 300000.00, 11, true, 2, 3, 0);

-- Insert example matches
INSERT INTO matches (team1_id, team2_id, match_date, match_time, venue, status, score_team1, score_team2) VALUES
(1, 2, '2026-07-18', '15:00:00', 'Old Trafford', 'completed', 2, 1),
(3, 1, '2026-07-25', '17:30:00', 'Anfield', 'completed', 1, 1),
(2, 3, '2026-07-30', '16:00:00', 'Etihad Stadium', 'completed', 3, 2),
(1, 3, '2026-08-08', '17:30:00', 'Old Trafford', 'scheduled', 0, 0),
(2, 1, '2026-08-15', '16:00:00', 'Etihad Stadium', 'scheduled', 0, 0),
(3, 2, '2026-08-22', '15:00:00', 'Anfield', 'scheduled', 0, 0);

-- Completed-match events
INSERT INTO match_events (match_id, event_type, player_id, team_id, minute, description) VALUES
(1, 'goal', 1, 1, 24, 'Opening goal'),
(1, 'goal', 2, 2, 51, 'Equaliser'),
(1, 'goal', 1, 1, 78, 'Winning goal'),
(2, 'goal', 3, 3, 34, 'Liverpool take the lead'),
(2, 'goal', 1, 1, 69, 'Manchester United equalise'),
(3, 'goal', 2, 2, 18, 'Early goal'),
(3, 'goal', 3, 3, 39, 'Liverpool equalise'),
(3, 'goal', 2, 2, 57, 'Manchester City regain the lead'),
(3, 'goal', 3, 3, 72, 'Second equaliser'),
(3, 'goal', 2, 2, 86, 'Late winner');

INSERT INTO player_stats (player_id, games_played, goals, assists, yellow_cards, red_cards, clean_sheets, minutes_played, pass_accuracy, shots_on_target) VALUES
(1, 2, 3, 0, 0, 0, 0, 180, 82.50, 6),
(2, 2, 4, 1, 0, 0, 0, 180, 91.20, 7),
(3, 2, 3, 0, 1, 0, 0, 180, 86.40, 6);

-- Insert example leaderboard entries
INSERT INTO leaderboard (manager_id, team_id, total_points, league_rank, games_won, games_drawn, games_lost, goals_for, goals_against, goal_difference) VALUES
(1, 1, 4, 1, 1, 1, 0, 3, 2, 1),
(2, 2, 3, 2, 1, 0, 1, 4, 4, 0),
(3, 3, 1, 3, 0, 1, 1, 3, 4, -1);

-- Insert example user settings
INSERT INTO user_settings (user_id, user_type, email_notifications, match_reminders, dark_mode, language, timezone) VALUES
(1, 'manager', true, true, false, 'en', 'Europe/London'),
(2, 'manager', true, true, true, 'en', 'Europe/London'),
(3, 'manager', true, false, false, 'en', 'Europe/London'); 
