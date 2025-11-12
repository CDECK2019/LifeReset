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
        duration_days: 30,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Customize Your Program</h2>
            <p className="text-slate-300 text-sm mt-1">
              Based on {templateProgram.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Program Name
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="My Custom Program"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                rows={3}
                placeholder="What is this program about?"
              />
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Categories & Tasks
                </h3>
                <div className="text-sm text-slate-600">
                  {getTotalTasks()} tasks · ~{getTotalTime()} min/day
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(categories).map(([categoryKey, tasks]) => (
                  <div key={categoryKey} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700 uppercase">
                        {categoryKey.replace(/_/g, ' ')}
                      </h4>
                      <button
                        onClick={() => removeCategory(categoryKey)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-3">
                      {tasks.map((task, taskIndex) => (
                        <div key={task.id} className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-4 h-4 text-slate-400 mt-2 flex-shrink-0" />

                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={task.name}
                                onChange={(e) => updateTask(categoryKey, taskIndex, 'name', e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                                placeholder="Task name"
                              />

                              <input
                                type="text"
                                value={task.description}
                                onChange={(e) => updateTask(categoryKey, taskIndex, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                                placeholder="Task description"
                              />

                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-600">Time (min):</label>
                                <input
                                  type="number"
                                  value={task.time_estimate}
                                  onChange={(e) => updateTask(categoryKey, taskIndex, 'time_estimate', parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
                                  min="0"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => removeTask(categoryKey, taskIndex)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
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
                      className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task to {categoryKey.replace(/_/g, ' ')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="New category name (e.g., Physical, Mental)"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Make sure to add all tasks you want to track daily
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !programName.trim() || getTotalTasks() === 0}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save & Start Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
