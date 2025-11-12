import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories } from '../lib/database.types';
import { BookOpen, Dumbbell, Smartphone, Pen, Heart, Settings } from 'lucide-react';
import { ProgramCustomizer } from './ProgramCustomizer';

type Program = Database['public']['Tables']['programs']['Row'];

const PROGRAM_ICONS = {
  'Miracle Morning': BookOpen,
  '75 Hard Lite': Dumbbell,
  'Digital Detox Reset': Smartphone,
  "Writer's Reset": Pen,
  'Fitness Foundation': Heart,
};

interface ProgramSelectorProps {
  onProgramSelect: (programId: string) => void;
}

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
      .update({
        current_program_id: selectedProgram,
        streak_start_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', user.id);

    onProgramSelect(selectedProgram);
  };

  const handleCustomize = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomizingProgram(program);
  };

  const handleCustomizerClose = () => {
    setCustomizingProgram(null);
  };

  const handleCustomizerSave = () => {
    setCustomizingProgram(null);
    onProgramSelect('');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Life Reset
          </h1>
          <p className="text-slate-300 text-lg">
            Select a transformation program to begin your journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {programs.map((program) => {
            const Icon = PROGRAM_ICONS[program.name as keyof typeof PROGRAM_ICONS] || BookOpen;
            const taskCategories = program.task_categories as TaskCategories;
            const totalTasks = getTotalTasks(taskCategories);
            const estimatedTime = getEstimatedTime(taskCategories);
            const isSelected = selectedProgram === program.id;

            return (
              <div key={program.id} className="relative">
                <button
                  onClick={() => setSelectedProgram(program.id)}
                  className={`w-full bg-white rounded-2xl p-6 text-left transition-all transform hover:scale-105 ${
                    isSelected
                      ? 'ring-4 ring-slate-500 shadow-2xl'
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-slate-100 p-3 rounded-xl">
                      <Icon className="w-6 h-6 text-slate-700" />
                    </div>
                    {isSelected && (
                      <div className="bg-slate-900 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Selected
                      </div>
                    )}
                  </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {program.name}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {program.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{totalTasks}</span> tasks
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">~{estimatedTime}</span> min/day
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-medium mb-2">
                    CATEGORIES
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(taskCategories).map((category) => (
                      <span
                        key={category}
                        className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs capitalize"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => handleCustomize(program, e)}
                className="absolute bottom-4 right-4 bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors shadow-lg z-10"
                title="Customize this program"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            );
          })}
        </div>

        {selectedProgram && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleStartProgram}
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-xl"
            >
              Start Your Reset
            </button>
          </div>
        )}
      </div>

      {customizingProgram && (
        <ProgramCustomizer
          templateProgram={{
            id: customizingProgram.id,
            name: customizingProgram.name,
            description: customizingProgram.description,
            task_categories: customizingProgram.task_categories as TaskCategories,
          }}
          onClose={handleCustomizerClose}
          onSave={handleCustomizerSave}
        />
      )}
    </div>
  );
}
