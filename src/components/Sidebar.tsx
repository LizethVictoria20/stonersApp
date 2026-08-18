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
  Building2,
  Layers3,
  PackageSearch
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
    description: string;
    section: 'Principal' | 'Operación' | 'Administración';
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }

  const allNavItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: isAdmin ? 'Dashboard & Reportes' : 'Mi Dashboard y Resumen', 
      description: 'Resumen y tendencias',
      section: 'Principal',
      icon: LayoutDashboard, 
      badge: isAdmin ? 'Global' : 'Personal' 
    },
    { 
      id: 'sales', 
      label: isAdmin ? 'Ventas y Presupuestos' : 'Mis Ventas y Presupuesto', 
      description: 'Ingresos y objetivos',
      section: 'Principal',
      icon: DollarSign, 
      badge: 'WP / Tienda' 
    },
    { 
      id: 'stores', 
      label: 'Sedes y Tiendas', 
      description: 'Puntos de operación',
      section: 'Operación',
      icon: Building2, 
      badge: 'Ciudades', 
      adminOnly: true 
    },
    {
      id: 'products',
      label: 'Productos e Inventario',
      description: isAdmin ? 'Catálogo, stock y lotes' : 'Catálogo y disponibilidad',
      section: 'Operación',
      icon: PackageSearch,
      badge: 'Stock',
    },
    { 
      id: 'tasks', 
      label: isAdmin ? 'Controlador de Tareas' : 'Mis Tareas Operativas', 
      description: 'Seguimiento diario',
      section: 'Operación',
      icon: CheckSquare, 
      badge: 'En vivo' 
    },
    { id: 'sops', label: 'Manual SOPs', description: 'Procesos y protocolos', section: 'Operación', icon: BookOpen, badge: 'Guías' },
    { 
      id: 'kpis', 
      label: isAdmin ? 'Metas e Indicadores' : 'Mis Metas y Desempeño', 
      description: 'Resultados del equipo',
      section: 'Operación',
      icon: TrendingUp 
    },
    { id: 'team', label: 'Gestión de Equipo', description: 'Usuarios y permisos', section: 'Administración', icon: Users, badge: 'Roles', adminOnly: true },
    { id: 'exports', label: 'Reportes y Exportación', description: 'PDF, Excel y CSV', section: 'Administración', icon: FileSpreadsheet, badge: 'Exportar', adminOnly: true },
    { id: 'supabase_cloud', label: 'Base de Datos', description: 'Conexión y sincronización', section: 'Administración', icon: Database, badge: 'Supabase', adminOnly: true }
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);
  const sections: NavItem['section'][] = ['Principal', 'Operación', 'Administración'];

  return (
    <aside className="w-full flex-shrink-0 border-b border-slate-200 bg-slate-50/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/95 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r transition-colors duration-200">
      <div className="space-y-5">
      
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
      <nav className="rounded-3xl border border-slate-200/80 bg-white/70 p-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Layers3 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 dark:text-neutral-200">Módulos Operativos</p>
              <p className="text-[9px] text-slate-400 dark:text-neutral-500">Centro de trabajo</p>
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
            {navItems.length}
          </span>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const sectionItems = navItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section}>
                <div className="mb-1.5 flex items-center gap-2 px-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-600">{section}</span>
                  <span className="h-px flex-1 bg-slate-100 dark:bg-neutral-800/80" />
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group relative flex min-h-[3.75rem] w-full items-center gap-3 overflow-hidden rounded-2xl border px-2.5 py-2 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/60 shadow-sm shadow-emerald-900/5 dark:border-emerald-800/70 dark:from-emerald-950/70 dark:to-teal-950/30 dark:shadow-emerald-950/30'
                            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-neutral-400 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/80'
                        }`}
                      >
                        {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-emerald-500" />}
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                          isActive
                            ? 'border-emerald-200 bg-white text-emerald-600 shadow-sm dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'border-slate-200 bg-slate-100 text-slate-400 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500 dark:group-hover:border-emerald-900 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-400'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[11px] font-extrabold leading-tight ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-700 group-hover:text-slate-950 dark:text-neutral-300 dark:group-hover:text-white'}`}>
                            {item.label}
                          </span>
                          <span className="mt-1 block truncate text-[9px] font-medium text-slate-400 dark:text-neutral-500">
                            {item.description}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          {item.badge && (
                            <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-extrabold ${
                              isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? 'translate-x-0 text-emerald-500' : '-translate-x-0.5 text-slate-300 group-hover:translate-x-0 dark:text-neutral-700'}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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

      </div>

    </aside>
  );
};
