import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories, CompletedTasks, Task } from '../lib/database.types';
import { X, Check, Clock, MessageSquare, Smile } from 'lucide-react';

type Program = Database['public']['Tables']['programs']['Row'];
type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

interface MissionControlProps {
  programId: string;
  program: Program;
  day: number;
  onClose: () => void;
  onComplete: () => void;
}

export function MissionControl({ programId, program, day, onClose, onComplete }: MissionControlProps) {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [reflection, setReflection] = useState('');
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [energyRating, setEnergyRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDailyLog();
  }, [day]);

  const loadDailyLog = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users_profile')
      .select('streak_start_date')
      .eq('id', user.id)
      .maybeSingle() as any;

    if (!profile?.streak_start_date) return;

    const startDate = new Date(profile.streak_start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day - 1);
    const dateStr = dayDate.toISOString().split('T')[0];

    const { data: log } = (await supabase
      .from('daily_logs')
      .select('*')
      .eq('program_id', programId)
      .eq('program_day', day)
      .maybeSingle()) as any;

    if (log) {
      setDailyLog(log);
      setCompletedTasks((log.tasks_completed as CompletedTasks) || {});
      setReflection(log.reflection_text || '');
      setMoodRating(log.mood_rating);
      setEnergyRating(log.energy_rating);
    } else {
      const { data: newLog, error } = await (supabase
        .from('daily_logs') as any)
        .insert({
          user_id: user.id,
          program_id: programId,
          program_day: day,
          date: dateStr,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating daily log:', error);
      } else {
        setDailyLog(newLog);
      }
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!dailyLog) return;

    const newCompletedTasks = { ...completedTasks };

    if (newCompletedTasks[taskId]) {
      delete newCompletedTasks[taskId];
    } else {
      newCompletedTasks[taskId] = {
        completed_at: new Date().toISOString(),
        method: 'checkoff',
      };
    }

    setCompletedTasks(newCompletedTasks);

    await (supabase
      .from('daily_logs') as any)
      .update({
        tasks_completed: newCompletedTasks,
      })
      .eq('id', dailyLog.id);
  };

  const saveReflection = async () => {
    if (!dailyLog) return;
    setSaving(true);

    await (supabase
      .from('daily_logs') as any)
      .update({
        reflection_text: reflection,
        mood_rating: moodRating,
        energy_rating: energyRating,
      })
      .eq('id', dailyLog.id);

    setSaving(false);
  };

  const completeDay = async () => {
    if (!dailyLog) return;
    setSaving(true);

    const taskCategories = program.task_categories as unknown as TaskCategories;
    const allTasks: Task[] = Object.values(taskCategories).flat();
    const missedTasks = allTasks
      .filter(task => !completedTasks[task.id])
      .map(task => task.id);

    await (supabase
      .from('daily_logs') as any)
      .update({
        completed_at: new Date().toISOString(),
        tasks_missed: missedTasks,
        reflection_text: reflection,
        mood_rating: moodRating,
        energy_rating: energyRating,
      })
      .eq('id', dailyLog.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: streak } = (await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle()) as any;

      if (streak) {
        const newStreak = streak.current_streak + 1;
        await (supabase
          .from('streaks') as any)
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_completed_date: dailyLog.date,
          })
          .eq('user_id', user.id);
      }
    }

    setSaving(false);
    onComplete();
  };

  const taskCategories = program.task_categories as unknown as TaskCategories;
  const allTasks: Task[] = Object.values(taskCategories).flat();
  const completedCount = Object.keys(completedTasks).length;
  const totalTasks = allTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/50 animate-scale-in relative z-10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Day {day}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {completedCount}/{totalTasks} completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tasks Column */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                  Tasks
                </h3>

                <div className="space-y-8">
                  {Object.entries(taskCategories).map(([category, tasks]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div className="grid gap-3">
                        {tasks.map((task) => {
                          const isCompleted = !!completedTasks[task.id];
                          return (
                            <button
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${isCompleted
                                ? 'bg-emerald-50/50 border-emerald-100'
                                : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 mt-0.5 border-2 ${isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 scale-110'
                                    : 'bg-transparent border-slate-200 group-hover:border-indigo-300'
                                    }`}
                                >
                                  {isCompleted && (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold text-base transition-colors ${isCompleted ? 'text-emerald-900 line-through opacity-70' : 'text-slate-900'
                                    }`}>
                                    {task.name}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                                    {task.description}
                                  </div>
                                  {task.time_estimate > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-3 bg-slate-100/50 w-fit px-2 py-1 rounded-md">
                                      <Clock className="w-3 h-3" />
                                      {task.time_estimate} min
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reflection Column */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                    <Smile className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  Check-in
                </h3>

                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Energy Level
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setEnergyRating(rating)}
                          className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all duration-300 ${energyRating === rating
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Mood Rating
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMoodRating(rating)}
                          className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all duration-300 ${moodRating === rating
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
                    <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  Reflection
                </h3>
                <div className="relative">
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    onBlur={saveReflection}
                    placeholder="What was your win today? What challenged you?"
                    className="w-full h-40 px-5 py-4 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium text-slate-700 placeholder:text-slate-400 transition-all shadow-sm"
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    {saving ? 'Saving...' : 'Auto-saved'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-200/60 bg-white/50 flex items-center justify-between backdrop-blur-md">
          <div className="text-sm font-medium text-slate-500">
            {completedCount === totalTasks ? (
              <span className="text-emerald-600 flex items-center gap-2">
                <Check className="w-4 h-4" /> All tasks completed!
              </span>
            ) : (
              <span>{totalTasks - completedCount} tasks remaining</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all"
            >
              Close
            </button>
            {!dailyLog?.completed_at && (
              <button
                onClick={completeDay}
                disabled={saving}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {saving ? 'Saving...' : 'Complete Day'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
