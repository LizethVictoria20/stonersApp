import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  TrendingUp, 
  Users, 
  FileSpreadsheet, 
  Database,
  ChevronRight,
  Shield,
  Bot,
  DollarSign,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDepartmentLabel } from '../utils/formatters';

interface SidebarProps {
  onOpenAIModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAIModal }) => {
  const { activeTab, setActiveTab, currentUser, selectedDeptFilter, setSelectedDeptFilter } = useApp();

  const isAdmin = currentUser.role === 'admin';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }

  const allNavItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: isAdmin ? 'Dashboard & Reportes' : 'Mi Dashboard y Resumen', 
      icon: LayoutDashboard, 
      badge: isAdmin ? 'Global' : 'Personal' 
    },
    { 
      id: 'sales', 
      label: isAdmin ? 'Ventas y Presupuestos' : 'Mis Ventas y Presupuesto', 
      icon: DollarSign, 
      badge: 'WP / Tienda' 
    },
    { 
      id: 'stores', 
      label: 'Sedes y Tiendas', 
      icon: Building2, 
      badge: 'Ciudades', 
      adminOnly: true 
    },
    { 
      id: 'tasks', 
      label: isAdmin ? 'Controlador de Tareas' : 'Mis Tareas Operativas', 
      icon: CheckSquare, 
      badge: 'En vivo' 
    },
    { id: 'sops', label: 'Manual SOPs', icon: BookOpen, badge: 'Guías' },
    { 
      id: 'kpis', 
      label: isAdmin ? 'Metas e Indicadores' : 'Mis Metas y Desempeño', 
      icon: TrendingUp 
    },
    { id: 'team', label: 'Gestión de Equipo', icon: Users, badge: 'Roles', adminOnly: true },
    { id: 'exports', label: 'Reportes y Exportación', icon: FileSpreadsheet, badge: 'PDF/Excel', adminOnly: true },
    { id: 'supabase_cloud', label: 'Base de Datos Supabase', icon: Database, badge: 'Supabase', adminOnly: true }
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-4 space-y-6 dark:border-neutral-800 dark:bg-neutral-950 transition-colors duration-200">
      
      {/* Current Role Badge Card */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-sm dark:border-emerald-900/40 dark:bg-gradient-to-br dark:from-neutral-900 dark:to-emerald-950/40 dark:shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">Rol Activo</span>
          <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white capitalize">{currentUser.role} - {currentUser.name}</p>
        <p className="text-[11px] text-slate-600 dark:text-neutral-400">{getDepartmentLabel(currentUser.department)}</p>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
          Módulos Operativos
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 dark:shadow-emerald-950/40'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-neutral-900 dark:text-neutral-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Department Filter Section */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-900 space-y-2">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
          Filtrar por Área
        </div>
        <select
          value={selectedDeptFilter}
          onChange={(e) => setSelectedDeptFilter(e.target.value as any)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">Ver Todas las Áreas</option>
          <option value="sales">Ventas</option>
          <option value="admin">Administrador</option>
          <option value="accounting">Contabilidad</option>
        </select>
      </div>

      {/* Stoners AI Card CTA */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 space-y-2 dark:border-teal-800/40 dark:bg-gradient-to-br dark:from-teal-950/60 dark:to-neutral-900">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Generador de Tareas e IA</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-tight">
          Cree manuales SOP, resuma la productividad mensual o desglose tareas automáticamente con Gemini IA.
        </p>
        <button
          onClick={onOpenAIModal}
          className="w-full flex items-center justify-center gap-1 rounded-xl bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 dark:bg-teal-600/30 dark:hover:bg-teal-600/50 border border-teal-500/40 py-1.5 text-[11px] font-bold dark:text-teal-300 transition-all"
        >
          <span>Lanzar Asistente IA</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 pt-2 text-[10px] text-slate-400 dark:text-neutral-600 text-center">
        Stoners Colombia v2.5 Operativa
      </div>

    </aside>
  );
};
