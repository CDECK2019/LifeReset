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
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Your Journey
        </h2>

        <div
          ref={scrollContainerRef}
          className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        >
          {days.map((dayStatus) => (
            <button
              key={dayStatus.day}
              onClick={() => !dayStatus.isFuture && onDaySelect(dayStatus.day)}
              disabled={dayStatus.isFuture}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                dayStatus.isFuture
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-slate-50 cursor-pointer'
              } ${
                selectedDay === dayStatus.day
                  ? 'bg-slate-100 shadow-md'
                  : dayStatus.isToday
                  ? 'bg-blue-50'
                  : ''
              }`}
            >
              <div
                className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  selectedDay === dayStatus.day
                    ? 'ring-4 ring-slate-400 shadow-lg'
                    : dayStatus.isToday
                    ? 'ring-4 ring-blue-400 shadow-lg'
                    : ''
                } ${
                  dayStatus.isFuture
                    ? 'bg-slate-100'
                    : dayStatus.completed
                    ? 'bg-green-500'
                    : dayStatus.completionPercentage > 0
                    ? 'bg-yellow-400'
                    : 'bg-slate-200'
                }`}
                style={{
                  background: !dayStatus.isFuture && !dayStatus.completed && dayStatus.completionPercentage > 0
                    ? `conic-gradient(#22c55e ${dayStatus.completionPercentage * 3.6}deg, #fbbf24 0deg)`
                    : undefined,
                }}
              >
                <div className={`absolute inset-2 rounded-full flex items-center justify-center ${
                  dayStatus.isFuture
                    ? 'bg-slate-50'
                    : dayStatus.completed
                    ? 'bg-green-400'
                    : dayStatus.completionPercentage > 0
                    ? 'bg-yellow-300'
                    : 'bg-slate-100'
                }`}>
                  {dayStatus.completed ? (
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  ) : (
                    <Circle className={`w-4 h-4 ${
                      dayStatus.isFuture ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                  )}
                </div>

                {dayStatus.isToday && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    NOW
                  </div>
                )}
              </div>

              <div className="flex-1 text-left">
                <div className={`font-semibold ${
                  dayStatus.isToday
                    ? 'text-blue-600'
                    : dayStatus.isFuture
                    ? 'text-slate-400'
                    : 'text-slate-900'
                }`}>
                  Day {dayStatus.day}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {dayStatus.date}
                </div>
              </div>

              {dayStatus.completionPercentage > 0 && !dayStatus.completed && (
                <div className="text-sm font-medium text-slate-600">
                  {dayStatus.completionPercentage}%
                </div>
              )}

              {dayStatus.completed && (
                <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
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
