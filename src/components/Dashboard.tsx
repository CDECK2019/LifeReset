import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DayTimeline } from './DayTimeline';
import { MissionControl } from './MissionControl';
import { ProgramSelector } from './ProgramSelector';
import { ProgramCustomizer } from './ProgramCustomizer';
import { ProgramDashboard } from './ProgramDashboard';
import { NotificationSettings } from './NotificationSettings';
import { LogOut, Flame, Menu, Home, Settings, Bell } from 'lucide-react';
import { Database } from '../lib/database.types';
import { initializeNotifications } from '../lib/notificationService';

type UserProfile = Database['public']['Tables']['users_profile']['Row'];
type Program = Database['public']['Tables']['programs']['Row'];

export function Dashboard() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');

  useEffect(() => {
    loadUserData();
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await (supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle() as any);

    if (settings && settings.notifications_enabled) {
      // Initialize notifications with user's settings
      await initializeNotifications({
        morningTime: settings.morning_notification_time.substring(0, 5),
        eveningTime: settings.evening_notification_time.substring(0, 5),
        morningEnabled: settings.morning_notification_enabled,
        eveningEnabled: settings.evening_notification_enabled,
      });
    }
  };

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .maybeSingle() as any;

    if (profileData) {
      setProfile(profileData);

      if (profileData.current_program_id) {
        const { data: programData } = await supabase
          .from('programs')
          .select('*')
          .eq('id', profileData.current_program_id)
          .maybeSingle() as any;

        if (programData) {
          setProgram(programData);
        }
      }

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle() as any;

      if (streakData) {
        setStreak(streakData.current_streak);
      }
    }

    setLoading(false);
  };

  const handleProgramSelect = async () => {
    await loadUserData();
  };

  const handleBackToPrograms = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase
      .from('users_profile') as any)
      .update({
        current_program_id: null,
      })
      .eq('id', user.id);

    setProfile(prev => prev ? { ...prev, current_program_id: null } : null);
    setProgram(null);
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleViewCalendar = () => {
    setView('calendar');
  };

  const handleViewDashboard = () => {
    setView('dashboard');
    setSelectedDay(null);
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
    <div className="min-h-screen bg-slate-50 relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-[80px] opacity-60" />
      </div>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {program.name}
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Day {getCurrentDay(profile.streak_start_date, program.duration_days)} of {program.duration_days}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-2.5 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-orange-100/50 shadow-sm animate-scale-in">
                  <div className="bg-orange-100 p-1.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-bold text-slate-900">{streak}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Streak</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBackToPrograms}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-all duration-300 text-slate-400 hover:text-slate-600"
                title="Back to Programs"
              >
                <Home className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2.5 hover:bg-slate-100 rounded-full transition-all duration-300 text-slate-400 hover:text-slate-600"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-lg border border-white/20 overflow-hidden z-50 animate-scale-in">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowCustomizer(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Customize Program</span>
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowNotificationSettings(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Notification Settings</span>
                        </button>
                        <div className="border-t border-slate-100" />
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            signOut();
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {view === 'dashboard' ? (
          <ProgramDashboard
            program={program}
            onViewCalendar={handleViewCalendar}
            onViewToday={() => {
              const currentDay = getCurrentDay(profile.streak_start_date, program.duration_days);
              setSelectedDay(currentDay);
            }}
            currentDay={getCurrentDay(profile.streak_start_date, program.duration_days)}
            streak={streak}
          />
        ) : (
          <div>
            <button
              onClick={handleViewDashboard}
              className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            <DayTimeline
              programId={program.id}
              durationDays={program.duration_days}
              onDaySelect={handleDaySelect}
              selectedDay={selectedDay}
            />
          </div>
        )}

        {selectedDay !== null && (
          <MissionControl
            programId={program.id}
            program={program}
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
            onComplete={handleDayComplete}
          />
        )}

        {showCustomizer && program && (
          <ProgramCustomizer
            templateProgram={{
              id: program.id,
              name: program.name,
              description: program.description,
              task_categories: program.task_categories as any,
            }}
            onClose={() => setShowCustomizer(false)}
            onSave={async () => {
              setShowCustomizer(false);
              await loadUserData();
            }}
            isEditMode={true}
          />
        )}

        {showNotificationSettings && (
          <NotificationSettings
            onClose={() => setShowNotificationSettings(false)}
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
