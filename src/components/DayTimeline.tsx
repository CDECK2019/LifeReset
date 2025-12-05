import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

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
      .maybeSingle() as any;

    if (!profile?.streak_start_date) return;

    const startDate = new Date(profile.streak_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs } = (await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', programId)) as any;

    const logsByDate = new Map(
      (logs || []).map((log: any) => [log.date, log])
    );

    const dayStatuses: DayStatus[] = [];

    for (let i = 0; i < durationDays; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const dateStr = dayDate.toISOString().split('T')[0];
      const log: any = logsByDate.get(dateStr);

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
    <div className="mb-12 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Your Journey
        </h2>
        <div className="text-sm font-medium text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white/50 backdrop-blur-sm">
          {Math.round((days.filter(d => d.completed).length / durationDays) * 100)}% Complete
        </div>
      </div>

      <div className="relative group">
        {/* Fade gradients for scroll indication - only on desktop */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        {/* Fade gradients for vertical scroll on mobile */}
        <div className="md:hidden absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="md:hidden absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollContainerRef}
          className="flex flex-col md:flex-row gap-5 overflow-y-auto md:overflow-y-visible md:overflow-x-auto pb-8 pt-2 px-2 snap-y md:snap-x snap-mandatory scrollbar-hide max-h-[70vh] md:max-h-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {days.map((dayStatus, index) => (
            <button
              key={dayStatus.day}
              onClick={() => !dayStatus.isFuture && onDaySelect(dayStatus.day)}
              disabled={dayStatus.isFuture}
              className={`flex-shrink-0 w-full md:w-64 snap-center group/card relative transition-all duration-500 ${dayStatus.isFuture ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer hover:-translate-y-1'
                }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`h-full rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden ${selectedDay === dayStatus.day
                ? 'bg-white ring-2 ring-indigo-500 ring-offset-2 shadow-xl shadow-indigo-500/10 border-transparent'
                : dayStatus.isToday
                  ? 'bg-white ring-1 ring-indigo-200 shadow-lg shadow-indigo-500/5 border-indigo-100'
                  : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                }`}>

                {/* Progress Background for partially completed days */}
                {!dayStatus.completed && dayStatus.completionPercentage > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-500"
                    style={{ width: `${dayStatus.completionPercentage}%` }}
                  />
                )}

                <div className="flex items-start justify-between mb-8">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${dayStatus.completed
                    ? 'bg-emerald-100 text-emerald-600'
                    : dayStatus.isToday
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-500'
                    }`}>
                    {dayStatus.day}
                  </div>

                  {dayStatus.completed ? (
                    <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-sm shadow-emerald-500/20">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${dayStatus.isToday ? 'border-indigo-100' : 'border-slate-100'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${dayStatus.isToday ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'
                        }`} />
                    </div>
                  )}
                </div>

                <div>
                  <div className={`text-sm font-medium mb-1 ${dayStatus.isToday ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                    {new Date(dayStatus.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {new Date(dayStatus.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {dayStatus.isToday && (
                  <div className="absolute top-4 right-1/2 translate-x-1/2 -translate-y-full opacity-0 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                      TODAY
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
