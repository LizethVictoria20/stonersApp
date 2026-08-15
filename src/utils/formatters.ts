import { UserRole, Department, TaskPriority, TaskStatus } from '../types';

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'vendedor':
      return 'Vendedor';
    case 'contador':
      return 'Contador';
    default:
      return role;
  }
}

export function getDepartmentLabel(dept: Department | 'all'): string {
  switch (dept) {
    case 'sales':
      return 'Ventas';
    case 'admin':
      return 'Administrador';
    case 'accounting':
      return 'Contabilidad';
    case 'all':
      return 'Todas las Áreas';
    default:
      return dept;
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'Urgente / Crítica';
    case 'high':
      return 'Alta Prioridad';
    case 'medium':
      return 'Media Prioridad';
    case 'low':
      return 'Baja Prioridad';
    default:
      return priority;
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En Proceso';
    case 'review':
      return 'En Revisión';
    case 'completed':
      return 'Completada';
    case 'overdue':
      return 'Vencida';
    default:
      return status;
  }
}

export function getPriorityBadgeColor(priority: TaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30';
    case 'high':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30';
    case 'medium':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30';
    case 'low':
      return 'bg-blue-500/15 text-blue-800 dark:text-blue-400 border border-blue-500/30';
  }
}

export function getStatusBadgeColor(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20';
    case 'in_progress':
      return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30';
    case 'review':
      return 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30';
    case 'overdue':
      return 'bg-rose-600/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 animate-pulse';
  }
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

export interface DailyTaskInfo {
  isDaily: boolean;
  isCompletedToday: boolean;
  isActiveWindowNow: boolean;
  isPastEndTimeNow: boolean;
  isBeforeStartTimeNow: boolean;
  startTimeLabel: string;
  endTimeLabel: string;
  statusBadgeText: string;
  badgeBgClass: string;
}

export function getDailyTaskInfo(task: {
  isDaily?: boolean;
  dailyStartTime?: string;
  dailyEndTime?: string;
  lastCompletedDate?: string;
  status?: string;
}): DailyTaskInfo {
  if (!task.isDaily) {
    return {
      isDaily: false,
      isCompletedToday: false,
      isActiveWindowNow: false,
      isPastEndTimeNow: false,
      isBeforeStartTimeNow: false,
      startTimeLabel: '',
      endTimeLabel: '',
      statusBadgeText: '',
      badgeBgClass: ''
    };
  }

  const startTime = task.dailyStartTime || '06:00';
  const endTime = task.dailyEndTime || '21:00';

  const formatTime12 = (t: string) => {
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const startLabel = formatTime12(startTime);
  const endLabel = formatTime12(endTime);

  const todayStr = new Date().toISOString().split('T')[0];
  const isCompletedToday = task.lastCompletedDate === todayStr || task.status === 'completed';

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const [sH, sM] = startTime.split(':').map(Number);
  const startMins = (isNaN(sH) ? 6 : sH) * 60 + (isNaN(sM) ? 0 : sM);

  const [eH, eM] = endTime.split(':').map(Number);
  const endMins = (isNaN(eH) ? 21 : eH) * 60 + (isNaN(eM) ? 0 : eM);

  const isActiveWindowNow = currentMins >= startMins && currentMins <= endMins;
  const isPastEndTimeNow = currentMins > endMins;
  const isBeforeStartTimeNow = currentMins < startMins;

  if (isCompletedToday) {
    return {
      isDaily: true,
      isCompletedToday: true,
      isActiveWindowNow,
      isPastEndTimeNow,
      isBeforeStartTimeNow,
      startTimeLabel: startLabel,
      endTimeLabel: endLabel,
      statusBadgeText: `✅ Hecha Hoy (${startLabel} - ${endLabel})`,
      badgeBgClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
    };
  }

  if (isActiveWindowNow) {
    return {
      isDaily: true,
      isCompletedToday: false,
      isActiveWindowNow: true,
      isPastEndTimeNow: false,
      isBeforeStartTimeNow: false,
      startTimeLabel: startLabel,
      endTimeLabel: endLabel,
      statusBadgeText: `⚡ Activa Hoy (${startLabel} - ${endLabel})`,
      badgeBgClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 animate-pulse'
    };
  }

  if (isPastEndTimeNow) {
    return {
      isDaily: true,
      isCompletedToday: false,
      isActiveWindowNow: false,
      isPastEndTimeNow: true,
      isBeforeStartTimeNow: false,
      startTimeLabel: startLabel,
      endTimeLabel: endLabel,
      statusBadgeText: `⚠️ No hecha hoy (Cerró ${endLabel})`,
      badgeBgClass: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/40'
    };
  }

  return {
    isDaily: true,
    isCompletedToday: false,
    isActiveWindowNow: false,
    isPastEndTimeNow: false,
    isBeforeStartTimeNow: true,
    startTimeLabel: startLabel,
    endTimeLabel: endLabel,
    statusBadgeText: `🕒 Inicia a las ${startLabel}`,
    badgeBgClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30'
  };
}

export function getChannelLabel(channel: 'whatsapp' | 'tienda' | 'otro'): string {
  switch (channel) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'tienda':
      return 'En Tienda';
    case 'otro':
      return 'Otro Medio';
    default:
      return channel;
  }
}
