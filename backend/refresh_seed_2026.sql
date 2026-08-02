BEGIN;

UPDATE teams SET formation = CASE name WHEN 'Manchester United' THEN '4-2-3-1' ELSE '4-3-3' END
WHERE name IN ('Manchester United', 'Manchester City', 'Liverpool FC');

UPDATE matches SET match_date='2026-07-18', match_time='15:00:00', status='completed', score_team1=2, score_team2=1 WHERE id=1;
UPDATE matches SET match_date='2026-07-25', match_time='17:30:00', status='completed', score_team1=1, score_team2=1 WHERE id=2;
UPDATE matches SET match_date='2026-07-30', match_time='16:00:00', status='completed', score_team1=3, score_team2=2 WHERE id=3;

INSERT INTO matches (team1_id, team2_id, match_date, match_time, venue, status, score_team1, score_team2)
SELECT 1,3,'2026-08-08','17:30:00','Old Trafford','scheduled',0,0 WHERE NOT EXISTS (SELECT 1 FROM matches WHERE team1_id=1 AND team2_id=3 AND match_date='2026-08-08');
INSERT INTO matches (team1_id, team2_id, match_date, match_time, venue, status, score_team1, score_team2)
SELECT 2,1,'2026-08-15','16:00:00','Etihad Stadium','scheduled',0,0 WHERE NOT EXISTS (SELECT 1 FROM matches WHERE team1_id=2 AND team2_id=1 AND match_date='2026-08-15');
INSERT INTO matches (team1_id, team2_id, match_date, match_time, venue, status, score_team1, score_team2)
SELECT 3,2,'2026-08-22','15:00:00','Anfield','scheduled',0,0 WHERE NOT EXISTS (SELECT 1 FROM matches WHERE team1_id=3 AND team2_id=2 AND match_date='2026-08-22');

INSERT INTO match_events (match_id,event_type,player_id,team_id,minute,description)
SELECT * FROM (VALUES
  (1,'goal',1,1,24,'Opening goal'),(1,'goal',2,2,51,'Equaliser'),(1,'goal',1,1,78,'Winning goal'),
  (2,'goal',3,3,34,'Liverpool take the lead'),(2,'goal',1,1,69,'Manchester United equalise'),
  (3,'goal',2,2,18,'Early goal'),(3,'goal',3,3,39,'Liverpool equalise'),(3,'goal',2,2,57,'Manchester City regain the lead'),
  (3,'goal',3,3,72,'Second equaliser'),(3,'goal',2,2,86,'Late winner')
) AS event(match_id,event_type,player_id,team_id,minute,description)
WHERE NOT EXISTS (SELECT 1 FROM match_events existing WHERE existing.match_id=event.match_id AND existing.minute=event.minute AND existing.event_type=event.event_type);

INSERT INTO player_stats (player_id,games_played,goals,assists,yellow_cards,red_cards,clean_sheets,minutes_played,pass_accuracy,shots_on_target)
VALUES (1,2,3,0,0,0,0,180,82.50,6),(2,2,4,1,0,0,0,180,91.20,7),(3,2,3,0,1,0,0,180,86.40,6)
ON CONFLICT (player_id) DO UPDATE SET games_played=EXCLUDED.games_played,goals=EXCLUDED.goals,assists=EXCLUDED.assists,yellow_cards=EXCLUDED.yellow_cards,red_cards=EXCLUDED.red_cards,clean_sheets=EXCLUDED.clean_sheets,minutes_played=EXCLUDED.minutes_played,pass_accuracy=EXCLUDED.pass_accuracy,shots_on_target=EXCLUDED.shots_on_target,last_updated=CURRENT_TIMESTAMP;

UPDATE players SET games_played=2,goals=3,assists=0,is_available=true WHERE id=1;
UPDATE players SET games_played=2,goals=4,assists=1,is_available=true WHERE id=2;
UPDATE players SET games_played=2,goals=3,assists=0,is_available=true WHERE id=3;

UPDATE leaderboard SET total_points=4,league_rank=1,games_won=1,games_drawn=1,games_lost=0,goals_for=3,goals_against=2,goal_difference=1 WHERE manager_id=1;
UPDATE leaderboard SET total_points=3,league_rank=2,games_won=1,games_drawn=0,games_lost=1,goals_for=4,goals_against=4,goal_difference=0 WHERE manager_id=2;
UPDATE leaderboard SET total_points=1,league_rank=3,games_won=0,games_drawn=1,games_lost=1,goals_for=3,goals_against=4,goal_difference=-1 WHERE manager_id=3;

COMMIT;
