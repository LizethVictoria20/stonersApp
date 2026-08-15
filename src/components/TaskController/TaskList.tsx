import React, { useState } from 'react';
import { 
  Plus, 
  List, 
  Kanban, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  FileSpreadsheet, 
  BookOpen, 
  MoreVertical,
  Trash2,
  Edit,
  Filter,
  CheckSquare,
  Repeat,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../UserAvatar';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { 
  getDepartmentLabel, 
  getPriorityBadgeColor, 
  getStatusBadgeColor, 
  getPriorityLabel, 
  getStatusLabel,
  getDailyTaskInfo
} from '../../utils/formatters';

interface TaskListProps {
  onOpenAddTaskModal: () => void;
  onOpenTaskDetailModal: (task: Task) => void;
  onOpenExcelImportModal: () => void;
  onOpenAIModal?: (prompt?: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  onOpenAddTaskModal, 
  onOpenTaskDetailModal, 
  onOpenExcelImportModal,
  onOpenAIModal
}) => {
  const { tasks, searchQuery, selectedDeptFilter, updateTask, deleteTask, currentUser } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'daily' | 'regular'>('all');

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDeptFilter === 'all' || t.department === selectedDeptFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || (typeFilter === 'daily' ? t.isDaily : !t.isDaily);

    return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesType;
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'pending', label: 'Pendientes', color: 'border-amber-500/40 text-amber-400' },
    { id: 'in_progress', label: 'En Proceso', color: 'border-sky-500/40 text-sky-400' },
    { id: 'review', label: 'En Revisión', color: 'border-purple-500/40 text-purple-400' },
    { id: 'completed', label: 'Completadas', color: 'border-emerald-500/40 text-emerald-400' },
    { id: 'overdue', label: 'Vencidas', color: 'border-rose-500/40 text-rose-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Controlador de Tareas Operativas</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {filteredTasks.length} Tareas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Asignación en tiempo real, seguimiento de listas de verificación e integraciones SOP</p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenAIModal && (
            <button
              onClick={() => onOpenAIModal('¿Qué tareas me hacen falta por hacer y cuáles son mis tareas diarias activas hoy?')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-teal-500 hover:to-emerald-500 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-teal-200 animate-pulse" />
              <span>Consultar IA Mis Tareas</span>
            </button>
          )}

          <button
            onClick={onOpenExcelImportModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Importar Excel / CSV</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenAddTaskModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50 hover:from-emerald-500 hover:to-emerald-600 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: View Toggle & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-3 shadow-sm">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-neutral-400 mr-1">
            <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filtros:</span>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 py-1.5 px-3 text-xs text-slate-800 dark:text-neutral-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="critical">Urgente / Crítica</option>
            <option value="high">Alta Prioridad</option>
            <option value="medium">Media Prioridad</option>
            <option value="low">Baja Prioridad</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 py-1.5 px-3 text-xs text-slate-800 dark:text-neutral-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Proceso</option>
            <option value="review">En Revisión</option>
            <option value="completed">Completadas</option>
            <option value="overdue">Vencidas</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'daily' | 'regular')}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 py-1.5 px-3 text-xs text-slate-800 dark:text-neutral-300 focus:border-emerald-500 focus:outline-none font-medium"
          >
            <option value="all">Todas las Frecuencias</option>
            <option value="daily">🔄 Tareas Diarias (6am - 9pm)</option>
            <option value="regular">📌 Tareas Regulares</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'kanban' ? 'bg-emerald-500 text-black shadow' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Tablero Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-emerald-500 text-black shadow' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Listado</span>
          </button>
        </div>

      </div>

      {/* Render View Modes */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-neutral-800 dark:bg-neutral-900/40 p-3 min-h-[500px]">
                
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800 ${col.color}`}>
                  <span className="text-xs font-extrabold uppercase tracking-wider">{col.label}</span>
                  <span className="rounded-full bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-neutral-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500 border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl">
                      Sin tareas en este estado
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                      const dailyInfo = getDailyTaskInfo(task);
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isDoneToday = task.lastCompletedDate === todayStr || task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          onClick={() => onOpenTaskDetailModal(task)}
                          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-3.5 shadow-sm hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-md cursor-pointer transition-all space-y-3"
                        >
                          {/* Code & Priority */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-black text-slate-400 dark:text-neutral-400 uppercase tracking-wider">
                              {task.code}
                            </span>
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${getPriorityBadgeColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>

                          {/* Daily Task Badge */}
                          {task.isDaily && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-extrabold ${dailyInfo.badgeBgClass}`}>
                              <Repeat className="h-3 w-3 shrink-0" />
                              <span className="truncate">{dailyInfo.statusBadgeText}</span>
                            </div>
                          )}

                          {/* Title & Dept */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                              {task.title}
                            </h4>
                            <p className="mt-1 text-[10px] text-slate-500 dark:text-neutral-400">
                              {getDepartmentLabel(task.department)}
                            </p>
                          </div>

                          {/* Subtasks & SOP badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-neutral-900">
                            {task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-neutral-400">
                                <CheckSquare className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{completedSubtasks}/{task.subtasks.length}</span>
                              </div>
                            )}

                            {task.sopTitle && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/50 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/40">
                                <BookOpen className="h-2.5 w-2.5" />
                                <span className="truncate max-w-[90px]">SOP Vinc.</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Assigned & Due */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <UserAvatar name={task.assignedToName} role="vendedor" size="xs" />
                              <span className="text-[10px] text-slate-700 dark:text-neutral-300 truncate max-w-[80px] font-medium">
                                {task.assignedToName}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold ${task.status === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-neutral-400'}`}>
                              {task.isDaily ? 'Diaria' : task.dueDate}
                            </span>
                          </div>

                          {/* Quick Action Button for Daily Tasks */}
                          {task.isDaily && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDoneToday) {
                                  updateTask(task.id, { status: 'pending', lastCompletedDate: '' });
                                } else {
                                  updateTask(task.id, { status: 'completed', lastCompletedDate: todayStr });
                                }
                              }}
                              className={`w-full py-1.5 px-2 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                isDoneToday
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isDoneToday ? 'Hecha Hoy (Reabrir)' : 'Marcar Hecha Hoy'}</span>
                            </button>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/80 text-slate-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Tarea / Procedimiento</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Asignado a</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha Límite</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-900 text-slate-800 dark:text-neutral-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-neutral-500">
                    No se encontraron tareas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const dailyInfo = getDailyTaskInfo(t);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isDoneToday = t.lastCompletedDate === todayStr || t.status === 'completed';

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => onOpenTaskDetailModal(t)}
                      className="hover:bg-slate-50 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-neutral-400">{t.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{t.title}</span>
                          {t.isDaily && (
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-extrabold ${dailyInfo.badgeBgClass}`}>
                              <Repeat className="h-2.5 w-2.5" />
                              <span>{dailyInfo.statusBadgeText}</span>
                            </span>
                          )}
                          {t.sopTitle && (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                              SOP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-neutral-400">{getDepartmentLabel(t.department)}</td>
                      <td className="py-3 px-4">{t.assignedToName}</td>
                      <td className="py-3 px-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getPriorityBadgeColor(t.priority)}`}>
                          {getPriorityLabel(t.priority)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeColor(t.status)}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-neutral-400">{t.isDaily ? 'Diaria (6am-9pm)' : t.dueDate}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {t.isDaily && (
                            <button
                              onClick={() => {
                                if (isDoneToday) {
                                  updateTask(t.id, { status: 'pending', lastCompletedDate: '' });
                                } else {
                                  updateTask(t.id, { status: 'completed', lastCompletedDate: todayStr });
                                }
                              }}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${
                                isDoneToday
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                              title="Marcar o desmarcar tarea del día"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isDoneToday ? 'Hecha Hoy' : 'Completar Hoy'}</span>
                            </button>
                          )}
                          <button 
                            onClick={() => deleteTask(t.id)}
                            className="rounded p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:text-neutral-500 dark:hover:text-rose-400 dark:hover:bg-neutral-900 transition-all"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
