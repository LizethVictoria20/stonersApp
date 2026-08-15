import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Clock, 
  User, 
  BookOpen, 
  Send, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Paperclip,
  Repeat
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import { 
  getDepartmentLabel, 
  getPriorityBadgeColor, 
  getStatusBadgeColor, 
  getPriorityLabel, 
  getStatusLabel,
  getDailyTaskInfo
} from '../../utils/formatters';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { updateTask, toggleSubtask, currentUser, deleteTask } = useApp();
  const [newNote, setNewNote] = useState('');
  const [actualHoursInput, setActualHoursInput] = useState<number>(task?.actualHours || 0);

  if (!task) return null;

  const dailyInfo = getDailyTaskInfo(task);
  const todayStr = new Date().toISOString().split('T')[0];
  const isDoneToday = task.lastCompletedDate === todayStr || task.status === 'completed';

  const handleToggleDaily = () => {
    updateTask(task.id, {
      isDaily: !task.isDaily,
      dailyStartTime: task.dailyStartTime || '06:00',
      dailyEndTime: task.dailyEndTime || '21:00'
    });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask(task.id, { status: newStatus });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteItem = {
      id: `n-${Date.now()}`,
      authorName: currentUser.name,
      text: newNote.trim(),
      timestamp: new Date().toLocaleString('es-CO')
    };

    updateTask(task.id, {
      notes: [...task.notes, noteItem]
    });
    setNewNote('');
  };

  const handleSaveHours = () => {
    updateTask(task.id, { actualHours: Number(actualHoursInput) });
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar la tarea ${task.code}?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
  const progressPercentage = task.subtasks.length > 0 
    ? Math.round((completedSubtasksCount / task.subtasks.length) * 100) 
    : (task.status === 'completed' ? 100 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {task.code}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${getPriorityBadgeColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${getStatusBadgeColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{task.title}</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{getDepartmentLabel(task.department)}</p>
          </div>

          <button 
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Switcher Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
          <span className="text-xs font-bold text-slate-600 dark:text-neutral-400">Cambiar Estado Operativo:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['pending', 'in_progress', 'review', 'completed'] as TaskStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  task.status === st
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow'
                    : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400 hover:bg-slate-300 dark:hover:text-white'
                }`}
              >
                {getStatusLabel(st)}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Task Banner & Settings */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">Configuración de Tarea Diaria</span>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400">Activación diaria de 6:00 AM a 9:00 PM</p>
              </div>
            </div>

            <button
              onClick={handleToggleDaily}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                task.isDaily
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black border-emerald-500 dark:border-emerald-400 shadow'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:text-white'
              }`}
            >
              {task.isDaily ? '✓ Tarea Diaria Activa' : 'Convertir en Tarea Diaria'}
            </button>
          </div>

          {task.isDaily && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between bg-white dark:bg-neutral-900/80 p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-neutral-400 tracking-wider">Estado de Hoy:</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${dailyInfo.badgeBgClass}`}>
                      {dailyInfo.statusBadgeText}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isDoneToday) {
                      updateTask(task.id, { status: 'pending', lastCompletedDate: '' });
                    } else {
                      updateTask(task.id, { status: 'completed', lastCompletedDate: todayStr });
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isDoneToday
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isDoneToday ? 'Marcar como Pendiente' : 'Marcar como Hecha Hoy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-bold block">HORARIO DE INICIO:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{dailyInfo.startTimeLabel || '6:00 AM'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-bold block">HORARIO DE CIERRE:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{dailyInfo.endTimeLabel || '9:00 PM'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Descripción e Instrucciones</h4>
          <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800/80 text-xs text-slate-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line">
            {task.description || 'Sin descripción detallada proporcionada.'}
          </p>
        </div>

        {/* SOP Link if attached */}
        {task.sopTitle && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50">
            <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-xs font-bold text-teal-800 dark:text-teal-200">Vinculada al Manual SOP: {task.sopTitle}</p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400">Siga el procedimiento estándar de inocuidad y control.</p>
            </div>
          </div>
        )}

        {/* Subtask Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Lista de Verificación / Checklist ({completedSubtasksCount}/{task.subtasks.length})
            </h4>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{progressPercentage}% Completado</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="space-y-2">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => toggleSubtask(task.id, st.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 cursor-pointer hover:border-emerald-500/40 transition-all"
              >
                <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                  st.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-400 dark:border-neutral-600'
                }`}>
                  {st.completed && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                </div>
                <span className={`text-xs ${st.completed ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-800 dark:text-neutral-200'}`}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Time and Assigned User Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs">
          <div>
            <p className="text-slate-500 dark:text-neutral-400 font-semibold">Asignado a:</p>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{task.assignedToName}</p>
            <p className="text-slate-500 dark:text-neutral-500 text-[10px]">Por: {task.assignedByName}</p>
          </div>

          <div>
            <p className="text-slate-500 dark:text-neutral-400 font-semibold">Registro de Horas:</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-600 dark:text-neutral-400">Est: {task.estimatedHours} hrs | Real:</span>
              <input
                type="number"
                step="0.5"
                value={actualHoursInput}
                onChange={(e) => setActualHoursInput(Number(e.target.value))}
                className="w-16 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-0.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSaveHours}
                className="rounded-lg bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-slate-300 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>

        {/* Activity Notes & Feed */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Bitácora de Observaciones y Novedades</h4>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {task.notes.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic">No hay notas registradas para esta tarea.</p>
            ) : (
              task.notes.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800/80 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">{n.authorName}</span>
                    <span>{n.timestamp}</span>
                  </div>
                  <p className="mt-1 text-slate-800 dark:text-neutral-200">{n.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Note Input */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe una observación sobre el avance..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Delete button footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar Tarea</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
