import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { TaskCategories, Task } from '../lib/database.types';
import { supabase } from '../lib/supabase';

interface ProgramCustomizerProps {
  templateProgram: {
    id: string;
    name: string;
    description: string | null;
    task_categories: TaskCategories;
  };
  onClose: () => void;
  onSave: () => void;
}

export function ProgramCustomizer({ templateProgram, onClose, onSave }: ProgramCustomizerProps) {
  const [programName, setProgramName] = useState(`My ${templateProgram.name}`);
  const [programDescription, setProgramDescription] = useState(templateProgram.description || '');
  const [durationDays, setDurationDays] = useState(30);
  const [categories, setCategories] = useState<TaskCategories>(
    JSON.parse(JSON.stringify(templateProgram.task_categories))
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const addCategory = () => {
    if (!newCategoryName.trim()) return;

    const categoryKey = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    if (categories[categoryKey]) return;

    setCategories({
      ...categories,
      [categoryKey]: [],
    });
    setNewCategoryName('');
  };

  const removeCategory = (categoryKey: string) => {
    const newCategories = { ...categories };
    delete newCategories[categoryKey];
    setCategories(newCategories);
  };

  const addTask = (categoryKey: string) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      name: 'New Task',
      time_estimate: 15,
      description: 'Task description',
    };

    setCategories({
      ...categories,
      [categoryKey]: [...categories[categoryKey], newTask],
    });
  };

  const updateTask = (categoryKey: string, taskIndex: number, field: keyof Task, value: string | number) => {
    const newCategories = { ...categories };
    newCategories[categoryKey][taskIndex] = {
      ...newCategories[categoryKey][taskIndex],
      [field]: value,
    };
    setCategories(newCategories);
  };

  const removeTask = (categoryKey: string, taskIndex: number) => {
    const newCategories = { ...categories };
    newCategories[categoryKey] = newCategories[categoryKey].filter((_, i) => i !== taskIndex);
    setCategories(newCategories);
  };

  const handleSave = async () => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newProgram, error } = await supabase
      .from('programs')
      .insert({
        name: programName,
        description: programDescription,
        duration_days: durationDays,
        task_categories: categories,
        is_custom: true,
        is_template: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving program:', error);
      setSaving(false);
      return;
    }

    await supabase
      .from('users_profile')
      .update({
        current_program_id: newProgram.id,
        streak_start_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', user.id);

    setSaving(false);
    onSave();
  };

  const getTotalTasks = () => {
    return Object.values(categories).reduce((sum, tasks) => sum + tasks.length, 0);
  };

  const getTotalTime = () => {
    let total = 0;
    Object.values(categories).forEach(tasks => {
      tasks.forEach(task => {
        total += task.time_estimate;
      });
    });
    return total;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 flex items-center justify-between border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-light text-slate-900">Customize Your Program</h2>
            <p className="text-slate-500 text-sm mt-1 font-light">
              Based on {templateProgram.name}
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-light text-slate-600 mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                  placeholder="My Custom Program"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-slate-600 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                  placeholder="30"
                  min="1"
                  max="365"
                />
                <div className="flex gap-1 mt-2">
                  {[7, 14, 21, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all font-light ${
                        durationDays === days
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-slate-600 mb-2">
                Description
              </label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none font-light"
                rows={3}
                placeholder="What is this program about?"
              />
            </div>

            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-slate-900">
                  Categories & Tasks
                </h3>
                <div className="text-sm text-slate-400 font-light">
                  {getTotalTasks()} tasks · ~{getTotalTime()} min/day
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(categories).map(([categoryKey, tasks]) => (
                  <div key={categoryKey} className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-light text-slate-900 uppercase tracking-wide">
                        {categoryKey.replace(/_/g, ' ')}
                      </h4>
                      <button
                        onClick={() => removeCategory(categoryKey)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-4">
                      {tasks.map((task, taskIndex) => (
                        <div key={task.id} className="bg-white rounded-xl p-4 border border-slate-100">
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-4 h-4 text-slate-300 mt-3 flex-shrink-0" />

                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={task.name}
                                onChange={(e) => updateTask(categoryKey, taskIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                                placeholder="Task name"
                              />

                              <input
                                type="text"
                                value={task.description}
                                onChange={(e) => updateTask(categoryKey, taskIndex, 'description', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light text-slate-600"
                                placeholder="Task description"
                              />

                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-500 font-light">Time (min):</label>
                                <input
                                  type="number"
                                  value={task.time_estimate}
                                  onChange={(e) => updateTask(categoryKey, taskIndex, 'time_estimate', parseInt(e.target.value) || 0)}
                                  className="w-20 px-3 py-1.5 text-sm border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                                  min="0"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => removeTask(categoryKey, taskIndex)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                              title="Remove task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addTask(categoryKey)}
                      className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-light"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task to {categoryKey.replace(/_/g, ' ')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                  placeholder="New category name (e.g., Physical, Mental)"
                />
                <button
                  onClick={addCategory}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 font-light"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-light">
            Make sure to add all tasks you want to track daily
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 hover:bg-white rounded-full font-light transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !programName.trim() || getTotalTasks() === 0}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-full font-light hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? 'Saving...' : 'Save & Start Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
