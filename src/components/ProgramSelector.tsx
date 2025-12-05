import React, { useEffect, useState, useMemo, memo } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories } from '../lib/database.types';
import { Clock, Sliders, CheckCircle2, ArrowRight, Trash2, Eye, EyeOff, Undo2 } from 'lucide-react';
import { ProgramCustomizer } from './ProgramCustomizer';

type Program = Database['public']['Tables']['programs']['Row'];

const PROGRAM_GRADIENTS: Record<string, string> = {
  'Miracle Morning': 'from-amber-400 via-orange-400 to-orange-500',
  'Digital Detox': 'from-blue-400 via-indigo-400 to-indigo-500',
  "Writer's Reset": 'from-rose-400 via-pink-400 to-pink-500',
  'Fitness Foundation': 'from-cyan-400 via-blue-400 to-blue-500',
  'Psycho-Cybernetics': 'from-violet-600 via-purple-500 to-fuchsia-500',
  'Eat, Pray, Love': 'from-emerald-400 via-teal-400 to-rose-400',
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
  onCustomize,
  onDelete,
  isHiddenView = false
}: {
  program: Program;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCustomize: (p: Program, e: React.MouseEvent) => void;
  onDelete: (p: Program, e: React.MouseEvent) => void;
  isHiddenView?: boolean;
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

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 z-20">
        <button
          onClick={(e) => onCustomize(program, e)}
          className="bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/30 transition-all duration-300"
          title="Customize this program"
          aria-label="Customize program"
        >
          <Sliders className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => onDelete(program, e)}
          className="bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-red-500/50 transition-all duration-300"
          title={isHiddenView ? "Restore program" : (program.is_template ? "Hide program" : "Delete program")}
          aria-label={isHiddenView ? "Restore" : "Delete"}
        >
          {isHiddenView ? <Undo2 className="w-4 h-4" /> : (program.is_template ? <EyeOff className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />)}
        </button>
      </div>
    </div>
  );
});

ProgramCard.displayName = 'ProgramCard';

export function ProgramSelector({ onProgramSelect }: ProgramSelectorProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [customizingProgram, setCustomizingProgram] = useState<Program | null>(null);
  const [hiddenProgramIds, setHiddenProgramIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenPrograms');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    localStorage.setItem('hiddenPrograms', JSON.stringify(hiddenProgramIds));
  }, [hiddenProgramIds]);

  const loadPrograms = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('programs')
      .select('*')
      .order('name');

    if (user) {
      // Fetch templates AND user's custom programs
      query = query.or(`is_template.eq.true,created_by.eq.${user.id}`);
    } else {
      query = query.eq('is_template', true);
    }

    const { data, error } = await query;

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

  const handleDelete = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();

    if (showHidden) {
      // Restore program
      setHiddenProgramIds(prev => prev.filter(id => id !== program.id));
      return;
    }

    if (program.is_template) {
      // Hide template
      if (window.confirm('Remove this program from your view? You can restore it later from the menu.')) {
        setHiddenProgramIds(prev => [...prev, program.id]);
        if (selectedProgram === program.id) setSelectedProgram(null);
      }
    } else {
      // Delete custom program
      if (window.confirm('Are you sure you want to delete this custom program? This cannot be undone.')) {
        deleteProgram(program.id);
      }
    }
  };

  const deleteProgram = async (id: string) => {
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program');
    } else {
      setPrograms(prev => prev.filter(p => p.id !== id));
      if (selectedProgram === id) setSelectedProgram(null);
    }
  };

  const handleCustomizerClose = () => {
    setCustomizingProgram(null);
  };

  const handleCustomizerSave = () => {
    setCustomizingProgram(null);
    loadPrograms(); // Reload to see new custom program
    onProgramSelect('');
  };

  const visiblePrograms = programs.filter(p =>
    showHidden ? hiddenProgramIds.includes(p.id) : !hiddenProgramIds.includes(p.id)
  );

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
    <div className="min-h-screen bg-slate-50 p-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 animate-in slide-in-from-top-8 fade-in duration-700 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-extralight text-slate-900 mb-4 tracking-tight">
              Life <span className="font-semibold">Reset</span>
            </h1>
            <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
              {showHidden
                ? "Hidden Programs"
                : "Select a transformation program to begin your journey. Each path is designed to reset your habits and rebuild your discipline."}
            </p>
          </div>

          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-slate-100"
          >
            {showHidden ? (
              <>
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Programs
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Manage Hidden ({hiddenProgramIds.length})
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {visiblePrograms.map((program, index) => (
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
                onDelete={handleDelete}
                isHiddenView={showHidden}
              />
            </div>
          ))}

          {/* Create Custom Program Card - Only show in main view */}
          {!showHidden && (
            <div
              className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-backwards"
              style={{ animationDelay: `${visiblePrograms.length * 100}ms` }}
            >
              <button
                onClick={() => setCustomizingProgram({
                  id: 'new',
                  name: 'My Custom Program',
                  description: 'Design your own transformation journey',
                  task_categories: {},
                  duration_days: 30,
                  is_custom: true,
                  is_template: false,
                  created_by: null,
                  created_at: new Date().toISOString(),
                } as Program)}
                className="w-full h-full text-left group hover:scale-[1.02] transition-all duration-500 ease-out rounded-3xl outline-none focus:ring-4 focus:ring-slate-200"
              >
                <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 shadow-lg transition-all duration-500 border-2 border-dashed border-white/20 hover:border-white/40 min-h-[400px]">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05))] bg-[length:60px_60px]" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Sliders className="w-12 h-12 text-white" />
                    </div>

                    <h3 className="text-3xl font-semibold text-white tracking-tight drop-shadow-sm mb-3">
                      Create Custom Program
                    </h3>

                    <p className="text-white/80 text-sm leading-relaxed font-medium max-w-xs mb-6">
                      Design your own transformation journey with custom tasks, categories, and goals
                    </p>

                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Build From Scratch</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none transition-all duration-500 ${selectedProgram ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
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
