-- 1. Archive "75 Hard Lite" instead of deleting it.
-- This prevents the "foreign key constraint" error by keeping the data safe,
-- but effectively hides it from the "Select Program" screen because we filter by is_template = true.
UPDATE programs 
SET is_template = false 
WHERE name = '75 Hard Lite' AND is_template = true;

-- 2. Rename Digital Detox Reset
UPDATE programs 
SET name = 'Digital Detox' 
WHERE name = 'Digital Detox Reset' AND is_template = true;

-- 3. Insert Eat, Pray, Love template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  'Eat, Pray, Love',
  'A holistic journey focusing on nourishing your body, connecting spiritually, and spreading kindness through selfless acts.',
  30,
  true,
  '{
    "nutrition": [
      {
        "id": "healthy_eating",
        "name": "Nourish Body",
        "time_estimate": 0,
        "description": "Eat clean, whole foods that nourish your body (Eat)"
      },
      {
        "id": "hydration",
        "name": "Hydration",
        "time_estimate": 0,
        "description": "Drink 64oz of water daily"
      }
    ],
    "spiritual": [
      {
        "id": "prayer",
        "name": "Prayer & Meditation",
        "time_estimate": 15,
        "description": "Connect spiritually through prayer or silence (Pray)"
      }
    ],
    "social": [
      {
        "id": "kindness",
        "name": "Selfless Act",
        "time_estimate": 0,
        "description": "Perform one act of kindness or selfless deed (Love)"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;
