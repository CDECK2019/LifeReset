import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, TaskCategories } from '../lib/database.types';
import { Clock, Sliders } from 'lucide-react';
import { ProgramCustomizer } from './ProgramCustomizer';

type Program = Database['public']['Tables']['programs']['Row'];

const PROGRAM_GRADIENTS = {
  'Miracle Morning': 'from-amber-400 to-orange-500',
  '75 Hard Lite': 'from-emerald-400 to-teal-500',
  'Digital Detox Reset': 'from-blue-400 to-indigo-500',
  "Writer's Reset": 'from-rose-400 to-pink-500',
  'Fitness Foundation': 'from-cyan-400 to-blue-500',
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400 text-lg font-light">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h1 className="text-6xl font-light text-slate-900 mb-4 tracking-tight">
            Life Reset
          </h1>
          <p className="text-xl text-slate-500 font-light">
            Select a transformation program to begin your journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {programs.map((program) => {
            const gradient = PROGRAM_GRADIENTS[program.name as keyof typeof PROGRAM_GRADIENTS] || 'from-slate-400 to-slate-600';
            const taskCategories = program.task_categories as TaskCategories;
            const totalTasks = getTotalTasks(taskCategories);
            const estimatedTime = getEstimatedTime(taskCategories);
            const isSelected = selectedProgram === program.id;

            return (
              <div key={program.id} className="group relative">
                <button
                  onClick={() => setSelectedProgram(program.id)}
                  className={`w-full text-left transition-all duration-300 ${
                    isSelected
                      ? 'scale-[1.02]'
                      : 'hover:scale-[1.01]'
                  }`}
                >
                  <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 shadow-lg ${
                    isSelected ? 'ring-2 ring-slate-900 ring-offset-4' : ''
                  }`}>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <h3 className="text-2xl font-light text-white tracking-tight">
                          {program.name}
                        </h3>
                        {isSelected && (
                          <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                            Selected
                          </div>
                        )}
                      </div>

                      <p className="text-white/90 text-sm mb-8 leading-relaxed font-light">
                        {program.description}
                      </p>

                      <div className="flex items-center gap-6 text-white/80 text-sm mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                          <span className="font-light">{totalTasks} tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-light">{estimatedTime} min/day</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Object.keys(taskCategories).map((category) => (
                          <span
                            key={category}
                            className="bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-light capitalize border border-white/20"
                          >
                            {category.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </button>

                <button
                  onClick={(e) => handleCustomize(program, e)}
                  className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/30 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100"
                  title="Customize this program"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {selectedProgram && (
          <div className="flex justify-center">
            <button
              onClick={handleStartProgram}
              className="bg-slate-900 text-white px-12 py-4 rounded-full font-light text-lg hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl"
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
