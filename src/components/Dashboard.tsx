import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DayTimeline } from './DayTimeline';
import { MissionControl } from './MissionControl';
import { ProgramSelector } from './ProgramSelector';
import { LogOut, Flame } from 'lucide-react';
import { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['users_profile']['Row'];
type Program = Database['public']['Tables']['programs']['Row'];

export function Dashboard() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);

      if (profileData.current_program_id) {
        const { data: programData } = await supabase
          .from('programs')
          .select('*')
          .eq('id', profileData.current_program_id)
          .maybeSingle();

        if (programData) {
          setProgram(programData);
        }
      }

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (streakData) {
        setStreak(streakData.current_streak);
      }
    }

    setLoading(false);
  };

  const handleProgramSelect = async (programId: string) => {
    await loadUserData();
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleDayComplete = async () => {
    setSelectedDay(null);
    await loadUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400 text-lg font-light">Loading...</div>
      </div>
    );
  }

  if (!profile?.current_program_id || !program) {
    return <ProgramSelector onProgramSelect={handleProgramSelect} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                {program.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-light">
                Day {getCurrentDay(profile.streak_start_date, program.duration_days)} of {program.duration_days}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {streak > 0 && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-2.5 rounded-full border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-light text-slate-900 text-lg">{streak}</span>
                  <span className="text-sm text-slate-500 font-light">day streak</span>
                </div>
              )}

              <button
                onClick={signOut}
                className="p-2.5 hover:bg-slate-50 rounded-full transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <DayTimeline
          programId={program.id}
          durationDays={program.duration_days}
          onDaySelect={handleDaySelect}
          selectedDay={selectedDay}
        />

        {selectedDay !== null && (
          <MissionControl
            programId={program.id}
            program={program}
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
            onComplete={handleDayComplete}
          />
        )}
      </main>
    </div>
  );
}

function getCurrentDay(startDate: string | null, maxDays: number = 30): number {
  if (!startDate) return 1;

  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return Math.min(Math.max(diff + 1, 1), maxDays);
}
