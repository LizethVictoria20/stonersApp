import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, AlertTriangle, Calendar, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goal, Department } from '../../types';
import { getDepartmentLabel } from '../../utils/formatters';

export const GoalsManager: React.FC = () => {
  const { goals, addGoal, currentUser } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department | 'all'>('all');
  const [targetDate, setTargetDate] = useState('2026-08-31');
  const [metricType, setMetricType] = useState('Productividad %');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addGoal({
      title: title.trim(),
      description: description.trim(),
      department,
      targetDate,
      metricType
    });

    setTitle('');
    setDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manejador de Metas Mensuales</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {goals.length} Metas Activas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Puntajes proyectados, indicadores estratégicos y progreso operativo</p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Nueva Meta</span>
          </button>
        )}
      </div>

      {/* Goals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <div 
            key={goal.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm dark:shadow-lg space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {getDepartmentLabel(goal.department)}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{goal.title}</h3>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                goal.status === 'at_risk' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
              }`}>
                {goal.status === 'at_risk' ? 'En Riesgo' : 'En Progreso'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">{goal.description}</p>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-neutral-400 font-medium">{goal.metricType}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{goal.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    goal.status === 'at_risk' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${goal.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 pt-2 border-t border-slate-100 dark:border-neutral-900">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400 dark:text-neutral-400" />
                Meta: {goal.targetDate}
              </span>
              <span>Stoners Ops Goal</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for new goal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Establecer Nueva Meta Operativa</h3>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Título de la Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cero reclamos en dispensación este mes"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Área / Departamento</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Todas las Áreas</option>
                  <option value="sales">Ventas</option>
                  <option value="admin">Administrador</option>
                  <option value="accounting">Contabilidad</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Descripción y KPI Asociado</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivos específicos y criterios de evaluación..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Tipo de Métrica</label>
                  <input
                    type="text"
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value)}
                    placeholder="Ej: Calidad %"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 px-4 py-2 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
