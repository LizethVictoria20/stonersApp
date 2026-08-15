import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Wifi, 
  User as UserIcon, 
  CheckCheck, 
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { getRoleLabel } from '../utils/formatters';

interface NavbarProps {
  onOpenLoginModal: () => void;
  onOpenAIModal: () => void;
  onOpenGmailModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenLoginModal, 
  onOpenAIModal,
  onOpenGmailModal
}) => {
  const { 
    currentUser, 
    unreadNotificationCount, 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    theme, 
    toggleTheme, 
    searchQuery, 
    setSearchQuery,
    isSyncing,
    googleUser,
    gmailMessages
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const userNotifs = notifications.filter(n => n.userId === currentUser.id || currentUser.role === 'admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-emerald-900/30 dark:bg-neutral-950/90 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 p-0.5 shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 dark:bg-neutral-950">
              <span className="font-black text-emerald-400 text-lg tracking-tighter">SC</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                STONERS <span className="text-emerald-600 dark:text-emerald-400">COLOMBIA</span>
              </h1>
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 sm:inline-block">
                OPS PORTAL
              </span>
            </div>
            <p className="hidden text-[11px] font-medium text-slate-500 dark:text-neutral-400 sm:block">
              Control Operativo & Gestión de Personal
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas, SOPs, empleados o KPIs..."
              className="w-full rounded-xl border border-slate-200 bg-slate-100 py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* AI Ops Assistant Button */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-600 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
            <span className="hidden sm:inline">Stoners AI</span>
          </button>

          {/* Gmail Operational Inbox Button */}
          <button
            onClick={onOpenGmailModal}
            className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-500/50 hover:bg-slate-200 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            title={googleUser ? `Gmail conectado (${googleUser.email})` : 'Abrir bandeja de Gmail'}
          >
            <Mail className={`h-4 w-4 ${googleUser ? 'text-red-500' : 'text-slate-500 dark:text-neutral-400'}`} />
            <span className="hidden lg:inline">{googleUser ? 'Gmail' : 'Gmail'}</span>
            {googleUser && gmailMessages.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {/* Real-time sync badge */}
          <div 
            title={isSyncing ? "Sincronización en tiempo real activa" : "Conectando servidor"}
            className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
          >
            <Wifi className={`h-3 w-3 ${isSyncing ? "text-emerald-500 dark:text-emerald-400 animate-pulse" : "text-amber-500"}`} />
            <span>{isSyncing ? "En Línea" : "Conectando"}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-2 text-xs font-bold text-slate-800 hover:border-emerald-500/50 hover:bg-slate-200 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-emerald-500/50 dark:hover:bg-neutral-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Cambiar tono claro/oscuro"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-emerald-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700 hover:border-emerald-500/50 hover:bg-slate-200 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4 text-slate-700 dark:text-neutral-200" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-black">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notificaciones Operativas</h3>
                  </div>
                  {userNotifs.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60 pr-1 space-y-2">
                  {userNotifs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500 dark:text-neutral-400">Sin notificaciones pendientes</p>
                  ) : (
                    userNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`group p-2.5 rounded-xl cursor-pointer transition-colors ${
                          n.read ? 'bg-transparent text-slate-500 dark:text-neutral-400' : 'bg-emerald-50 text-slate-900 dark:bg-emerald-950/30 dark:text-white border-l-2 border-emerald-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">{n.timestamp}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-neutral-300 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Button */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-100 p-1.5 pr-3 hover:border-emerald-500/50 hover:bg-slate-200 dark:border-neutral-800 dark:bg-neutral-900/90 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <UserAvatar name={currentUser.name} role={currentUser.role} size="sm" />
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                {googleUser && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Google Auth Activo"></span>
                )}
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{getRoleLabel(currentUser.role)}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400" />
          </button>

        </div>

      </div>
    </header>
  );
};
