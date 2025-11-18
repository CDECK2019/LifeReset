import React, { useEffect, useState, useMemo, memo } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories } from '../lib/database.types';
import { Clock, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProgramCustomizer } from './ProgramCustomizer';

type Program = Database['public']['Tables']['programs']['Row'];

const PROGRAM_GRADIENTS: Record<string, string> = {
  'Miracle Morning': 'from-amber-400 via-orange-400 to-orange-500',
  '75 Hard Lite': 'from-emerald-400 via-teal-400 to-teal-500',
  'Digital Detox Reset': 'from-blue-400 via-indigo-400 to-indigo-500',
  "Writer's Reset": 'from-rose-400 via-pink-400 to-pink-500',
  'Fitness Foundation': 'from-cyan-400 via-blue-400 to-blue-500',
  'Psycho-Cybernetics': 'from-violet-600 via-purple-500 to-fuchsia-500',
};

interface ProgramSelectorProps {
  onProgramSelect: (programId: string) => void;
}

// Extract utility functions outside component to avoid recreation
const getTotalTasks = (taskCategories: TaskCategories) => {
  return Object.values(taskCategories).reduce((sum, tasks) => sum + tasks.length, 0);
};

const getEstimatedTime = (taskCategories: TaskCategories) => {
  let total = 0;
  Object.values(taskCategories).forEach(tasks => {
    tasks.forEach(task => {
      total += task.time_estimate;
    });
  });
  return total;
};

// Memoized Card Component for Performance
const ProgramCard = memo(({
  program,
  isSelected,
  onSelect,
  onCustomize
}: {
  program: Program;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCustomize: (p: Program, e: React.MouseEvent) => void;
}) => {
  const gradient = PROGRAM_GRADIENTS[program.name] || 'from-slate-400 to-slate-600';

  // Memoize expensive calculations for this specific card
  const { totalTasks, estimatedTime } = useMemo(() => {
    const taskCategories = program.task_categories as unknown as TaskCategories;
    return {
      totalTasks: getTotalTasks(taskCategories),
      estimatedTime: getEstimatedTime(taskCategories)
    };
  }, [program.task_categories]);

  return (
    <div className="group relative h-full">
      <button
        onClick={() => onSelect(program.id)}
        className={`w-full h-full text-left transition-all duration-500 ease-out ${isSelected
          ? 'scale-[1.02] ring-4 ring-slate-900/10'
          : 'hover:scale-[1.02] hover:shadow-xl'
          } rounded-3xl outline-none focus:ring-4 focus:ring-slate-200`}
      >
        <div className={`relative h-full overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 shadow-lg transition-all duration-500`}>
          {/* Background Pattern/Texture */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white tracking-tight drop-shadow-sm">
                {program.name}
              </h3>
              {isSelected && (
                <div className="bg-white/25 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selected
                </div>
              )}
            </div>

            <p className="text-white/95 text-sm mb-8 leading-relaxed font-medium opacity-90">
              {program.description}
            </p>

            <div className="mt-auto">
              <div className="flex items-center gap-6 text-white/90 text-sm mb-6 font-medium">
                <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span>{totalTasks} tasks</span>
                </div>
                <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{estimatedTime} min/day</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(program.task_categories as unknown as TaskCategories).map((category) => (
                  <span
                    key={category}
                    className="bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium capitalize border border-white/10 shadow-sm"
                  >
                    {category.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </button>

      <button
        onClick={(e) => onCustomize(program, e)}
        className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/30 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Customize this program"
        aria-label="Customize program"
      >
        <Sliders className="w-4 h-4" />
      </button>
    </div>
  );
});

ProgramCard.displayName = 'ProgramCard';

export function ProgramSelector({ onProgramSelect }: ProgramSelectorProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [customizingProgram, setCustomizingProgram] = useState<Program | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_template', true)
      .order('name');

    if (error) {
      console.error('Error loading programs:', error);
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const handleStartProgram = async () => {
    if (!selectedProgram) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('users_profile')
      // @ts-ignore
      .update({
        current_program_id: selectedProgram,
        streak_start_date: new Date().toISOString().split('T')[0],
      } as any)
      .eq('id', user.id);

    onProgramSelect(selectedProgram);
  };

  // Memoize handlers to prevent unnecessary re-renders of children
  const handleCustomize = useMemo(() => (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomizingProgram(program);
  }, []);

  const handleCustomizerClose = () => {
    setCustomizingProgram(null);
  };

  const handleCustomizerSave = () => {
    setCustomizingProgram(null);
    onProgramSelect('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <div className="text-slate-500 text-lg font-light animate-pulse">Loading programs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 animate-in slide-in-from-top-8 fade-in duration-700">
          <h1 className="text-6xl font-extralight text-slate-900 mb-4 tracking-tight">
            Life <span className="font-semibold">Reset</span>
          </h1>
          <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
            Select a transformation program to begin your journey. Each path is designed to reset your habits and rebuild your discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {programs.map((program, index) => (
            <div
              key={program.id}
              className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProgramCard
                program={program}
                isSelected={selectedProgram === program.id}
                onSelect={setSelectedProgram}
                onCustomize={handleCustomize}
              />
            </div>
          ))}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none transition-all duration-500 ${selectedProgram ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
            <button
              onClick={handleStartProgram}
              className="group bg-slate-900 text-white pl-10 pr-8 py-4 rounded-full font-medium text-lg hover:bg-slate-800 transition-all duration-300 shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 flex items-center gap-3"
            >
              Start Your Reset
              <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {customizingProgram && (
        <ProgramCustomizer
          templateProgram={{
            id: customizingProgram.id,
            name: customizingProgram.name,
            description: customizingProgram.description,
            task_categories: customizingProgram.task_categories as unknown as TaskCategories,
          }}
          onClose={handleCustomizerClose}
          onSave={handleCustomizerSave}
        />
      )}
    </div>
  );
}
