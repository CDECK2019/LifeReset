import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Calendar,
    Target,
    Flame,
    TrendingUp,
    CheckCircle2,
    ChevronRight,
    Award
} from 'lucide-react';
import { Database } from '../lib/database.types';

type Program = Database['public']['Tables']['programs']['Row'];
type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

interface ProgramDashboardProps {
    program: Program;
    onViewCalendar: () => void;
    onViewToday: () => void;
    currentDay: number;
    streak: number;
}

interface ProgramStats {
    totalDays: number;
    completedDays: number;
    currentDay: number;
    completionRate: number;
    currentStreak: number;
    todayCompleted: boolean;
    todayProgress: number;
}

export function ProgramDashboard({
    program,
    onViewCalendar,
    onViewToday,
    currentDay,
    streak
}: ProgramDashboardProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<ProgramStats>({
        totalDays: program.duration_days,
        completedDays: 0,
        currentDay: currentDay,
        completionRate: 0,
        currentStreak: streak,
        todayCompleted: false,
        todayProgress: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [program.id]);

    const loadStats = async () => {
        if (!user) return;

        try {
            // Get all logs for this program
            const { data: logs } = await (supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('program_id', program.id) as any);

            if (logs) {
                const completedDays = logs.filter((log: DailyLog) => log.completed_at).length;
                const completionRate = Math.round((completedDays / program.duration_days) * 100);

                // Check today's status
                const today = new Date().toISOString().split('T')[0];
                const todayLog = logs.find((log: DailyLog) => log.date === today);

                let todayProgress = 0;
                if (todayLog && todayLog.tasks_completed) {
                    const completed = Object.keys(todayLog.tasks_completed).length;
                    const total = completed + (todayLog.tasks_missed?.length || 0);
                    todayProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
                }

                setStats({
                    totalDays: program.duration_days,
                    completedDays,
                    currentDay,
                    completionRate,
                    currentStreak: streak,
                    todayCompleted: todayLog?.completed_at !== null,
                    todayProgress,
                });
            }
        } catch (error) {
            console.error('Error loading program stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">{program.name}</h1>
                            <p className="text-white/90 text-lg max-w-2xl">
                                {program.description || 'Your journey to transformation'}
                            </p>
                        </div>
                        {stats.currentStreak > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-300" />
                                <span className="font-bold text-xl">{stats.currentStreak}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-white/70 text-sm mb-1">Current Day</div>
                            <div className="text-3xl font-bold">{stats.currentDay}</div>
                            <div className="text-white/70 text-xs">of {stats.totalDays}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-white/70 text-sm mb-1">Completed</div>
                            <div className="text-3xl font-bold">{stats.completedDays}</div>
                            <div className="text-white/70 text-xs">days</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-white/70 text-sm mb-1">Progress</div>
                            <div className="text-3xl font-bold">{stats.completionRate}%</div>
                            <div className="text-white/70 text-xs">complete</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="text-white/70 text-sm mb-1">Today</div>
                            <div className="text-3xl font-bold">{stats.todayProgress}%</div>
                            <div className="text-white/70 text-xs">done</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Today's Tasks */}
                <button
                    onClick={onViewToday}
                    className="group relative overflow-hidden bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-xl">
                                <Target className="w-6 h-6 text-indigo-600" />
                            </div>
                            {stats.todayCompleted && (
                                <div className="bg-emerald-100 p-2 rounded-full">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                            )}
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Today's Mission</h3>
                        <p className="text-slate-600 mb-4">
                            {stats.todayCompleted
                                ? "Great job! You've completed today's tasks."
                                : "Start your daily tasks and build momentum"}
                        </p>

                        {!stats.todayCompleted && stats.todayProgress > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-slate-600">Progress</span>
                                    <span className="font-semibold text-indigo-600">{stats.todayProgress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.todayProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center text-indigo-600 font-medium group-hover:translate-x-2 transition-transform">
                            {stats.todayCompleted ? 'Review Tasks' : 'Start Now'}
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </div>
                    </div>
                </button>

                {/* View Calendar */}
                <button
                    onClick={onViewCalendar}
                    className="group relative overflow-hidden bg-white rounded-2xl p-8 border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                        <div className="bg-purple-100 p-3 rounded-xl mb-4 w-fit">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Full Calendar</h3>
                        <p className="text-slate-600 mb-4">
                            View your complete 30-day journey and track progress
                        </p>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-slate-600">{stats.completedDays} completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                                <span className="text-sm text-slate-600">{stats.totalDays - stats.completedDays} remaining</span>
                            </div>
                        </div>

                        <div className="flex items-center text-purple-600 font-medium group-hover:translate-x-2 transition-transform">
                            View Calendar
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </div>
                    </div>
                </button>
            </div>

            {/* Progress Insights */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Your Progress
                </h3>

                <div className="space-y-4">
                    {/* Overall Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Overall Completion</span>
                            <span className="text-sm font-bold text-indigo-600">{stats.completionRate}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${stats.completionRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${stats.completedDays >= 7 ? 'bg-emerald-100' : 'bg-slate-100'
                                }`}>
                                <Award className={`w-6 h-6 ${stats.completedDays >= 7 ? 'text-emerald-600' : 'text-slate-400'
                                    }`} />
                            </div>
                            <div className="text-xs font-medium text-slate-600">Week 1</div>
                            <div className="text-xs text-slate-500">{stats.completedDays >= 7 ? 'Complete!' : `${Math.max(0, 7 - stats.completedDays)} days left`}</div>
                        </div>
                        <div className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${stats.completedDays >= 15 ? 'bg-emerald-100' : 'bg-slate-100'
                                }`}>
                                <Award className={`w-6 h-6 ${stats.completedDays >= 15 ? 'text-emerald-600' : 'text-slate-400'
                                    }`} />
                            </div>
                            <div className="text-xs font-medium text-slate-600">Halfway</div>
                            <div className="text-xs text-slate-500">{stats.completedDays >= 15 ? 'Complete!' : `${Math.max(0, 15 - stats.completedDays)} days left`}</div>
                        </div>
                        <div className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${stats.completedDays >= 30 ? 'bg-emerald-100' : 'bg-slate-100'
                                }`}>
                                <Award className={`w-6 h-6 ${stats.completedDays >= 30 ? 'text-emerald-600' : 'text-slate-400'
                                    }`} />
                            </div>
                            <div className="text-xs font-medium text-slate-600">Complete</div>
                            <div className="text-xs text-slate-500">{stats.completedDays >= 30 ? 'Done! 🎉' : `${Math.max(0, 30 - stats.completedDays)} days left`}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
