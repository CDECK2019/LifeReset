import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Check, Circle } from 'lucide-react';

type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

interface DayTimelineProps {
  programId: string;
  durationDays: number;
  onDaySelect: (day: number) => void;
  selectedDay: number | null;
}

interface DayStatus {
  day: number;
  date: string;
  completed: boolean;
  completionPercentage: number;
  isToday: boolean;
  isFuture: boolean;
}

export function DayTimeline({ programId, durationDays, onDaySelect, selectedDay }: DayTimelineProps) {
  const [days, setDays] = useState<DayStatus[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDays();
  }, [programId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = days.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        const dayElement = scrollContainerRef.current.children[todayIndex] as HTMLElement;
        if (dayElement) {
          dayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [days]);

  const loadDays = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users_profile')
      .select('streak_start_date')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.streak_start_date) return;

    const startDate = new Date(profile.streak_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', programId);

    const logsByDate = new Map(
      (logs || []).map(log => [log.date, log])
    );

    const dayStatuses: DayStatus[] = [];

    for (let i = 0; i < durationDays; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const dateStr = dayDate.toISOString().split('T')[0];
      const log = logsByDate.get(dateStr);

      const isToday = dayDate.getTime() === today.getTime();
      const isFuture = dayDate.getTime() > today.getTime();

      let completionPercentage = 0;
      if (log && log.tasks_completed) {
        const completed = Object.keys(log.tasks_completed).length;
        const total = completed + (log.tasks_missed?.length || 0);
        completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      dayStatuses.push({
        day: i + 1,
        date: dateStr,
        completed: log?.completed_at !== null,
        completionPercentage,
        isToday,
        isFuture,
      });
    }

    setDays(dayStatuses);
  };

  return (
    <div className="mb-12">
      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        <h2 className="text-2xl font-light text-slate-900 mb-6 tracking-tight">
          Your Journey
        </h2>

        <div
          ref={scrollContainerRef}
          className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2"
        >
          {days.map((dayStatus) => (
            <button
              key={dayStatus.day}
              onClick={() => !dayStatus.isFuture && onDaySelect(dayStatus.day)}
              disabled={dayStatus.isFuture}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                dayStatus.isFuture
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-slate-50 cursor-pointer'
              } ${
                selectedDay === dayStatus.day
                  ? 'bg-slate-50 shadow-sm scale-[1.02]'
                  : dayStatus.isToday
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50'
                  : ''
              }`}
            >
              <div
                className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  selectedDay === dayStatus.day
                    ? 'ring-2 ring-slate-900 ring-offset-2'
                    : dayStatus.isToday
                    ? 'ring-2 ring-blue-400 ring-offset-2'
                    : ''
                } ${
                  dayStatus.isFuture
                    ? 'bg-slate-100'
                    : dayStatus.completed
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                    : dayStatus.completionPercentage > 0
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                    : 'bg-slate-200'
                }`}
                style={{
                  background: !dayStatus.isFuture && !dayStatus.completed && dayStatus.completionPercentage > 0
                    ? `conic-gradient(#10b981 ${dayStatus.completionPercentage * 3.6}deg, #f59e0b 0deg)`
                    : undefined,
                }}
              >
                <div className={`absolute inset-2 rounded-full flex items-center justify-center ${
                  dayStatus.isFuture
                    ? 'bg-white'
                    : dayStatus.completed
                    ? 'bg-gradient-to-br from-emerald-300 to-teal-400'
                    : dayStatus.completionPercentage > 0
                    ? 'bg-gradient-to-br from-amber-300 to-orange-300'
                    : 'bg-white'
                }`}>
                  {dayStatus.completed ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : (
                    <Circle className={`w-3 h-3 ${
                      dayStatus.isFuture ? 'text-slate-300' : 'text-slate-400'
                    }`} />
                  )}
                </div>

                {dayStatus.isToday && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-light px-2 py-0.5 rounded-full shadow-sm">
                    NOW
                  </div>
                )}
              </div>

              <div className="flex-1 text-left">
                <div className={`font-light text-lg ${
                  dayStatus.isToday
                    ? 'text-blue-600'
                    : dayStatus.isFuture
                    ? 'text-slate-400'
                    : 'text-slate-900'
                }`}>
                  Day {dayStatus.day}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-light">
                  {new Date(dayStatus.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              {dayStatus.completionPercentage > 0 && !dayStatus.completed && (
                <div className="text-sm font-light text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {dayStatus.completionPercentage}%
                </div>
              )}

              {dayStatus.completed && (
                <div className="text-xs font-light text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  Complete
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
