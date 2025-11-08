/*
  # Seed Program Templates

  ## Overview
  Populates the programs table with popular 30-day transformation templates
  ready for users to start immediately.

  ## Templates Added
  1. **Miracle Morning** - Morning routine focused on personal development
  2. **75 Hard Lite** - Simplified version of the 75 Hard challenge
  3. **Digital Detox Reset** - Tech mindfulness and screen time reduction
  4. **Writer's Reset** - Daily writing habit formation
  5. **Fitness Foundation** - Basic fitness and wellness routine

  ## Task Structure
  Each program includes categorized tasks with:
  - Task ID and name
  - Category (physical, mental, spiritual, etc.)
  - Time estimate
  - Description

  ## Notes
  - All templates are marked as is_template = true
  - created_by is null for system templates
  - Users can clone these to create custom versions
*/

-- Insert Miracle Morning template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  'Miracle Morning',
  'Transform your mornings with six daily practices: Silence, Affirmations, Visualization, Exercise, Reading, and Scribing. Start each day intentionally.',
  30,
  true,
  '{
    "physical": [
      {
        "id": "exercise",
        "name": "Morning Exercise",
        "time_estimate": 20,
        "description": "Any form of movement - yoga, running, stretching, or strength training"
      }
    ],
    "mental": [
      {
        "id": "reading",
        "name": "Read 10 Pages",
        "time_estimate": 15,
        "description": "Read from a personal development or inspirational book"
      },
      {
        "id": "scribing",
        "name": "Journal/Scribing",
        "time_estimate": 10,
        "description": "Write thoughts, gratitudes, or goals"
      }
    ],
    "spiritual": [
      {
        "id": "silence",
        "name": "Silence/Meditation",
        "time_estimate": 5,
        "description": "Quiet meditation, prayer, or breathing exercises"
      },
      {
        "id": "affirmations",
        "name": "Affirmations",
        "time_estimate": 5,
        "description": "Read or speak positive affirmations aloud"
      },
      {
        "id": "visualization",
        "name": "Visualization",
        "time_estimate": 5,
        "description": "Visualize your goals and ideal day"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;

-- Insert 75 Hard Lite template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  '75 Hard Lite',
  'A sustainable version of 75 Hard: daily workout, hydration, healthy eating, reading, and progress photo. Build mental toughness without burnout.',
  30,
  true,
  '{
    "physical": [
      {
        "id": "workout",
        "name": "45-Minute Workout",
        "time_estimate": 45,
        "description": "Any workout that gets your heart rate up"
      },
      {
        "id": "water",
        "name": "Drink 64oz Water",
        "time_estimate": 0,
        "description": "Stay hydrated throughout the day"
      },
      {
        "id": "photo",
        "name": "Progress Photo",
        "time_estimate": 2,
        "description": "Take a daily progress photo"
      }
    ],
    "nutrition": [
      {
        "id": "diet",
        "name": "Follow Nutrition Plan",
        "time_estimate": 0,
        "description": "Stick to your chosen healthy eating plan (no cheat meals)"
      }
    ],
    "mental": [
      {
        "id": "reading",
        "name": "Read 10 Pages",
        "time_estimate": 15,
        "description": "Read from a non-fiction educational book"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;

-- Insert Digital Detox Reset template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  'Digital Detox Reset',
  'Reclaim your attention and reduce screen addiction. Set boundaries with technology while building presence and real-world connections.',
  30,
  true,
  '{
    "digital": [
      {
        "id": "no_social_morning",
        "name": "No Social Media Before Noon",
        "time_estimate": 0,
        "description": "Keep phone away from bedroom, no scrolling until midday"
      },
      {
        "id": "screen_time_limit",
        "name": "Under 2 Hours Screen Time",
        "time_estimate": 0,
        "description": "Limit recreational screen time (excluding work)"
      },
      {
        "id": "phone_free_evening",
        "name": "Phone-Free Evening Hour",
        "time_estimate": 60,
        "description": "One hour before bed with no phone or screens"
      }
    ],
    "physical": [
      {
        "id": "outdoor_time",
        "name": "30 Minutes Outdoors",
        "time_estimate": 30,
        "description": "Walk, hike, or simply be outside"
      }
    ],
    "social": [
      {
        "id": "real_connection",
        "name": "Real-World Interaction",
        "time_estimate": 20,
        "description": "Call or meet someone in person (not text)"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;

-- Insert Writer's Reset template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  'Writer''s Reset',
  'Establish a daily writing practice. Overcome resistance, build consistency, and unlock your creative voice through daily commitment.',
  30,
  true,
  '{
    "writing": [
      {
        "id": "morning_pages",
        "name": "Morning Pages (750 words)",
        "time_estimate": 30,
        "description": "Stream of consciousness writing, 3 pages longhand"
      },
      {
        "id": "creative_work",
        "name": "30-Min Creative Writing",
        "time_estimate": 30,
        "description": "Work on your novel, blog, poetry, or creative project"
      }
    ],
    "mental": [
      {
        "id": "reading",
        "name": "Read 20 Pages",
        "time_estimate": 25,
        "description": "Read in your genre or craft books on writing"
      },
      {
        "id": "craft_study",
        "name": "Study Writing Craft",
        "time_estimate": 15,
        "description": "Watch a tutorial, read an essay, or analyze good writing"
      }
    ],
    "physical": [
      {
        "id": "walk",
        "name": "Walking Break",
        "time_estimate": 20,
        "description": "Walk to clear your mind between writing sessions"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;

-- Insert Fitness Foundation template
INSERT INTO programs (name, description, duration_days, is_template, task_categories, created_by)
VALUES (
  'Fitness Foundation',
  'Build sustainable fitness habits with balanced training, recovery, and nutrition. Perfect for beginners or those returning to fitness.',
  30,
  true,
  '{
    "physical": [
      {
        "id": "workout",
        "name": "30-Minute Workout",
        "time_estimate": 30,
        "description": "Strength training, cardio, or sports"
      },
      {
        "id": "steps",
        "name": "8,000 Steps",
        "time_estimate": 0,
        "description": "Hit your daily step goal"
      },
      {
        "id": "stretch",
        "name": "10-Min Stretching",
        "time_estimate": 10,
        "description": "Mobility work or yoga for recovery"
      }
    ],
    "nutrition": [
      {
        "id": "protein",
        "name": "Protein at Every Meal",
        "time_estimate": 0,
        "description": "Ensure adequate protein intake"
      },
      {
        "id": "water",
        "name": "Drink 64oz Water",
        "time_estimate": 0,
        "description": "Stay properly hydrated"
      }
    ],
    "recovery": [
      {
        "id": "sleep",
        "name": "7+ Hours Sleep",
        "time_estimate": 0,
        "description": "Prioritize recovery with quality sleep"
      }
    ]
  }'::jsonb,
  null
) ON CONFLICT DO NOTHING;