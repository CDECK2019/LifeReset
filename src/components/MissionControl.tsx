import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories, CompletedTasks, Task } from '../lib/database.types';
import { X, Check, Clock, MessageSquare, Image as ImageIcon, Smile } from 'lucide-react';

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
      .maybeSingle();

    if (!profile?.streak_start_date) return;

    const startDate = new Date(profile.streak_start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day - 1);
    const dateStr = dayDate.toISOString().split('T')[0];

    const { data: log } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    if (log) {
      setDailyLog(log);
      setCompletedTasks((log.tasks_completed as CompletedTasks) || {});
      setReflection(log.reflection_text || '');
      setMoodRating(log.mood_rating);
      setEnergyRating(log.energy_rating);
    } else {
      const { data: newLog, error } = await supabase
        .from('daily_logs')
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

    await supabase
      .from('daily_logs')
      .update({
        tasks_completed: newCompletedTasks,
      })
      .eq('id', dailyLog.id);
  };

  const saveReflection = async () => {
    if (!dailyLog) return;
    setSaving(true);

    await supabase
      .from('daily_logs')
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

    const taskCategories = program.task_categories as TaskCategories;
    const allTasks: Task[] = Object.values(taskCategories).flat();
    const missedTasks = allTasks
      .filter(task => !completedTasks[task.id])
      .map(task => task.id);

    await supabase
      .from('daily_logs')
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
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (streak) {
        const newStreak = streak.current_streak + 1;
        await supabase
          .from('streaks')
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

  const taskCategories = program.task_categories as TaskCategories;
  const allTasks: Task[] = Object.values(taskCategories).flat();
  const completedCount = Object.keys(completedTasks).length;
  const totalTasks = allTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const isToday = () => {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dailyLog?.date === today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 flex items-center justify-between border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-light text-slate-900">Day {day}</h2>
            <p className="text-slate-500 text-sm mt-1 font-light">
              {completedCount} of {totalTasks} tasks completed ({completionPercentage}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-light text-slate-900 mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5 text-slate-400" />
                  Tasks
                </h3>

                <div className="space-y-6">
                  {Object.entries(taskCategories).map(([category, tasks]) => (
                    <div key={category} className="bg-slate-50 rounded-2xl p-6">
                      <h4 className="text-sm font-light text-slate-900 uppercase tracking-wide mb-4">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div className="space-y-3">
                        {tasks.map((task) => {
                          const isCompleted = !!completedTasks[task.id];
                          return (
                            <button
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                      : 'bg-slate-200'
                                  }`}
                                >
                                  {isCompleted && (
                                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`font-light ${
                                    isCompleted ? 'text-emerald-900' : 'text-slate-900'
                                  }`}>
                                    {task.name}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1 font-light">
                                    {task.description}
                                  </div>
                                  {task.time_estimate > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2 font-light">
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

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-light text-slate-900 mb-6 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-slate-400" />
                  How are you feeling?
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-light text-slate-600 mb-3">
                      Energy Level
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setEnergyRating(rating)}
                          className={`flex-1 py-2.5 rounded-xl border font-light transition-all duration-300 ${
                            energyRating === rating
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500 text-white shadow-lg scale-110'
                              : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-600 mb-3">
                      Mood Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMoodRating(rating)}
                          className={`flex-1 py-2.5 rounded-xl border font-light transition-all duration-300 ${
                            moodRating === rating
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-lg scale-110'
                              : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
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
                <h3 className="text-lg font-light text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  Daily Reflection
                </h3>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  onBlur={saveReflection}
                  placeholder="What was your win today? What challenged you?"
                  className="w-full h-32 px-4 py-3 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none font-light"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-light">
            Progress: {completedCount}/{totalTasks} tasks
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 hover:bg-white rounded-full font-light transition-all"
            >
              Close
            </button>
            {!dailyLog?.completed_at && (
              <button
                onClick={completeDay}
                disabled={saving}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-full font-light hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
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
