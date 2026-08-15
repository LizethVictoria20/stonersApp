import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen, User, Calendar, AlertCircle, Repeat, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Department, TaskPriority } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose }) => {
  const { users, sops, addTask, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('sales');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [selectedSopId, setSelectedSopId] = useState('');
  const [subtasksInput, setSubtasksInput] = useState('');
  
  // Daily task fields
  const [isDaily, setIsDaily] = useState(false);
  const [dailyStartTime, setDailyStartTime] = useState('06:00');
  const [dailyEndTime, setDailyEndTime] = useState('21:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = users.find(u => u.id === assignedToId) || users[0];
    const selectedSop = sops.find(s => s.id === selectedSopId);

    const subtasks = subtasksInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((s, idx) => ({ id: `sub-${Date.now()}-${idx}`, title: s, completed: false }));

    addTask({
      title: title.trim(),
      description: description.trim(),
      department,
      priority,
      status: 'pending',
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      assignedToAvatar: assignedUser.avatar,
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      dueDate,
      estimatedHours,
      subtasks,
      sopId: selectedSop?.id,
      sopTitle: selectedSop?.title,
      isDaily,
      dailyStartTime: isDaily ? dailyStartTime : undefined,
      dailyEndTime: isDaily ? dailyEndTime : undefined,
      lastCompletedDate: ''
    });

    onClose();
  };

  const handleAIFillTask = () => {
    setTitle('Seguimiento de oportunidades comerciales de la semana');
    setDescription('Revisar contactos activos, actualizar el estado de cada oportunidad y definir las acciones de cierre prioritarias.');
    setDepartment('sales');
    setPriority('high');
    setSubtasksInput('Revisar oportunidades abiertas\nActualizar valores y fechas estimadas\nContactar clientes prioritarios\nRegistrar conclusiones del seguimiento');
    setEstimatedHours(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Crear Nueva Tarea Operativa</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Asigne responsabilidades, manuales SOP y fechas límites</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAIFillTask}
              className="flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Sugerir con IA</span>
            </button>
            <button 
              onClick={onClose} 
              className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Título de la Tarea *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sanitización de Mesas de Floración Lote 04"
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Departamento / Área</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="sales">Ventas</option>
                <option value="admin">Administrador</option>
                <option value="accounting">Contabilidad</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Nivel de Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="low">Baja Prioridad</option>
                <option value="medium">Media Prioridad</option>
                <option value="high">Alta Prioridad</option>
                <option value="critical">Urgente / Crítica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Empleado Asignado</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Fecha Límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Configuration Box for Daily Task */}
          <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs block">¿Es una Tarea Diaria Recurrente?</span>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400">
                    Se activará automáticamente todos los días entre las 6:00 AM y las 9:00 PM si no se marca como hecha.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isDaily}
                onChange={(e) => setIsDaily(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </label>

            {isDaily && (
              <div className="pt-3 border-t border-emerald-200 dark:border-emerald-900/40 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Hora de Activación Diaria</span>
                    </label>
                    <input
                      type="time"
                      value={dailyStartTime}
                      onChange={(e) => setDailyStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      <span>Hora Límite de Cierre</span>
                    </label>
                    <input
                      type="time"
                      value={dailyEndTime}
                      onChange={(e) => setDailyEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 p-2.5 border border-emerald-300 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">ℹ️</span>
                  <span>
                    <strong>Horario establecido (6:00 AM - 9:00 PM):</strong> Todos los días a las 6:00 AM la tarea se activará como pendiente. Si la persona asignada no la marca como realizada antes de las 9:00 PM, figurará como vencida del día.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Vincular Manual SOP de Referencia (Opcional)</label>
            <select
              value={selectedSopId}
              onChange={(e) => setSelectedSopId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Sin SOP vinculado</option>
              {sops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Descripción de Instrucciones</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle los objetivos y consideraciones de bioseguridad..."
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
              Subtareas / Checklist (Una por línea)
            </label>
            <textarea
              rows={3}
              value={subtasksInput}
              onChange={(e) => setSubtasksInput(e.target.value)}
              placeholder="Paso 1: Medición de pH&#10;Paso 2: Registro en bitácora&#10;Paso 3: Limpieza"
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 px-4 py-2 font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 transition-all shadow-md cursor-pointer"
            >
              Crear Tarea
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
