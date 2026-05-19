-- Add CBT-specific data column to therapy_sessions
-- Stores structured CBT data: mood ratings, cognitive distortion insights, and homework

alter table public.therapy_sessions
  add column if not exists cbt_data jsonb;

-- Example cbt_data structure:
-- {
--   "mood_ratings": [
--     { "type": "anxiety", "intensity": 7, "timestamp": 1711411200000 },
--     { "type": "anxiety", "intensity": 4, "timestamp": 1711414800000 }
--   ],
--   "insights": [
--     {
--       "situation": "Boss called me into office",
--       "automatic_thought": "I'm going to get fired",
--       "distortion": "catastrophizing",
--       "balanced_thought": "There could be many reasons for the meeting",
--       "timestamp": 1711412000000
--     }
--   ],
--   "homework": "Practice a thought record when I notice anxiety about work meetings"
-- }
