import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Award, 
  Target, 
  Users, 
  BookOpen,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { getDepartmentLabel, getRoleLabel, formatCOP } from '../../utils/formatters';
import { DollarSign, ChevronRight } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

export const KPIDashboard: React.FC = () => {
  const { tasks, kpis, users, sops, goals, salesBudgets, dailySales, setActiveTab, currentUser } = useApp();

  const isAdmin = currentUser.role === 'admin';

  // Sales metrics for active month (2026-08)
  const currentMonthStr = '2026-08';
  
  const rawMonthBudgets = salesBudgets.filter(b => b.month === currentMonthStr);
  const rawMonthSales = dailySales.filter(s => s.date.startsWith(currentMonthStr));

  const totalMonthBudget = isAdmin
    ? rawMonthBudgets.reduce((sum, b) => sum + b.targetAmount, 0)
    : (rawMonthBudgets.find(b => b.sellerId === currentUser.id)?.targetAmount || 0);

  const totalMonthSales = isAdmin
    ? rawMonthSales.reduce((sum, s) => sum + s.amount, 0)
    : rawMonthSales.filter(s => s.sellerId === currentUser.id).reduce((sum, s) => sum + s.amount, 0);

  const salesProgressPercent = totalMonthBudget > 0 ? Math.round((totalMonthSales / totalMonthBudget) * 100) : 0;

  // Metrics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Chart 1: Tasks by department
  const deptDataMap: Record<string, number> = {};
  tasks.forEach(t => {
    const label = getDepartmentLabel(t.department);
    deptDataMap[label] = (deptDataMap[label] || 0) + 1;
  });

  const deptChartData = Object.keys(deptDataMap).map(k => ({
    name: k,
    tareas: deptDataMap[k]
  }));

  // Chart 2: Task status distribution
  const statusDataMap: Record<string, number> = {
    'Pendientes': tasks.filter(t => t.status === 'pending').length,
    'En Proceso': tasks.filter(t => t.status === 'in_progress').length,
    'En Revisión': tasks.filter(t => t.status === 'review').length,
    'Completadas': completedTasks,
    'Vencidas': overdueTasks
  };

  const statusChartData = Object.keys(statusDataMap).map(k => ({
    name: k,
    value: statusDataMap[k]
  }));

  const COLORS = ['#f59e0b', '#0284c7', '#a855f7', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-6">
      
      {/* Sales Overview Banner */}
      <div 
        onClick={() => setActiveTab('sales')}
        className="cursor-pointer rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent p-5 dark:border-emerald-800/60 dark:bg-gradient-to-r dark:from-emerald-950/50 dark:via-neutral-950 dark:to-neutral-950 shadow-sm hover:border-emerald-500 transition-all group"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-950/30">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {isAdmin ? 'Metas de Ventas Mensuales (Global)' : 'Mi Meta de Ventas Mensual'}
                </span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Agosto 2026</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Vendido: {formatCOP(totalMonthSales)} <span className="text-xs font-normal text-slate-500 dark:text-neutral-400">/ Meta {formatCOP(totalMonthBudget)}</span>
              </h3>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-4 justify-between sm:justify-end">
            <div className="space-y-1 text-right">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {salesProgressPercent}% Cumplimiento
              </span>
              <div className="w-32 bg-slate-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, salesProgressPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Gestionar Ventas</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Completion Rate */}
        <div className="rounded-2xl border border-emerald-200 bg-white dark:border-emerald-900/40 dark:bg-gradient-to-br dark:from-neutral-950 dark:to-emerald-950/30 p-5 shadow-sm dark:shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Eficiencia de Equipo</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{completionRate}%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +3.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">{completedTasks} de {totalTasks} tareas finalizadas</p>
        </div>

        {/* Card 2: SOP Adherence */}
        <div className="rounded-2xl border border-teal-200 bg-white dark:border-teal-900/40 dark:bg-gradient-to-br dark:from-neutral-950 dark:to-teal-950/30 p-5 shadow-sm dark:shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Manuales SOPs</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{sops.length}</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Vigentes</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">Certificación activa en bioseguridad</p>
        </div>

        {/* Card 3: Overdue tasks alert */}
        <div className="rounded-2xl border border-rose-200 bg-white dark:border-rose-900/40 dark:bg-gradient-to-br dark:from-neutral-950 dark:to-rose-950/30 p-5 shadow-sm dark:shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Tareas Vencidas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{overdueTasks}</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Requieren atención</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">Con alerta de prioridad asignada</p>
        </div>

        {/* Card 4: Active Team */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm dark:shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Colaboradores</span>
            <div className="p-2 rounded-xl bg-slate-100 text-emerald-600 dark:bg-neutral-800 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Activos</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">Control de roles y permisos RBAC</p>
        </div>

      </div>

      {/* Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart: Tasks by Dept */}
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Carga Operativa por Departamento
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">Actualizado</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#10b981', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="tareas" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Distribución de Estados de Tareas
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">Totales</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#10b981', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Leaderboard & Productivity Score Table */}
      <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Ranking de Eficiencia de Personal (Score de Productividad)
            </h3>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
            Top Desempeño
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Área</th>
                <th className="py-2.5 px-3">Tareas Completadas</th>
                <th className="py-2.5 px-3">Score de Eficiencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
              {users
                .sort((a, b) => b.productivityScore - a.productivityScore)
                .map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-extrabold text-slate-400 dark:text-neutral-500">#{idx + 1}</span>
                        {u.avatar && u.avatar.trim() !== '' ? (
                          <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-neutral-700" />
                        ) : (
                          <UserAvatar name={u.name} role={u.role} size="sm" className="rounded-lg h-7 w-7" />
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-neutral-300">{getRoleLabel(u.role)}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-neutral-400">{getDepartmentLabel(u.department)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{u.tasksCompletedThisMonth} tareas</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${u.productivityScore}%` }} 
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs">{u.productivityScore} pts</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
