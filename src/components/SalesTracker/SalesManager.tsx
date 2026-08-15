import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  Store, 
  Globe, 
  Plus, 
  Calendar, 
  User as UserIcon, 
  Search, 
  Edit3, 
  Trash2, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Sparkles,
  Bot
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCOP, getChannelLabel } from '../../utils/formatters';
import { SalesBudget, DailySale, SalesChannel } from '../../types';
import { AddSaleModal } from './AddSaleModal';
import { SetBudgetModal } from './SetBudgetModal';
import { UserAvatar } from '../UserAvatar';

interface SalesManagerProps {
  onOpenAIModal?: (prompt?: string) => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({ onOpenAIModal }) => {
  const { 
    currentUser, 
    users, 
    stores,
    salesBudgets, 
    dailySales, 
    deleteSalesBudget, 
    deleteDailySale 
  } = useApp();

  const isAdmin = currentUser.role === 'admin';
  const isSellerOnly = !isAdmin;

  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<SalesChannel | 'all'>('all');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<DailySale | null>(null);

  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<SalesBudget | null>(null);

  // Raw sales for selected month
  const rawMonthSales = useMemo(() => {
    return dailySales.filter(s => s.date.startsWith(selectedMonth));
  }, [dailySales, selectedMonth]);

  // Scoped sales by role
  const monthSales = useMemo(() => {
    if (isSellerOnly) {
      return rawMonthSales.filter(s => s.sellerId === currentUser.id);
    }
    return rawMonthSales;
  }, [rawMonthSales, isSellerOnly, currentUser.id]);

  // Raw budgets for selected month
  const rawMonthBudgets = useMemo(() => {
    return salesBudgets.filter(b => b.month === selectedMonth);
  }, [salesBudgets, selectedMonth]);

  // Scoped budgets by role
  const monthBudgets = useMemo(() => {
    if (isSellerOnly) {
      return rawMonthBudgets.filter(b => b.sellerId === currentUser.id);
    }
    return rawMonthBudgets;
  }, [rawMonthBudgets, isSellerOnly, currentUser.id]);

  // Sellers to display in performance cards
  const displayedSellers = useMemo(() => {
    if (isSellerOnly) {
      return users.filter(u => u.id === currentUser.id);
    }
    return users;
  }, [users, isSellerOnly, currentUser.id]);

  // Totals calculations
  const totalMonthBudget = useMemo(() => {
    return monthBudgets.reduce((sum, b) => sum + b.targetAmount, 0);
  }, [monthBudgets]);

  const totalMonthSales = useMemo(() => {
    return monthSales.reduce((sum, s) => sum + s.amount, 0);
  }, [monthSales]);

  const overallProgressPercent = totalMonthBudget > 0 
    ? Math.round((totalMonthSales / totalMonthBudget) * 100) 
    : 0;

  // Channel breakdowns for selected month
  const channelBreakdown = useMemo(() => {
    const wpSales = monthSales.filter(s => s.channel === 'whatsapp');
    const tiendaSales = monthSales.filter(s => s.channel === 'tienda');
    const otroSales = monthSales.filter(s => s.channel === 'otro');

    const wpSum = wpSales.reduce((a, b) => a + b.amount, 0);
    const tiendaSum = tiendaSales.reduce((a, b) => a + b.amount, 0);
    const otroSum = otroSales.reduce((a, b) => a + b.amount, 0);

    const total = totalMonthSales || 1; // avoid divide by zero

    return {
      wp: { sum: wpSum, count: wpSales.length, percent: Math.round((wpSum / total) * 100) },
      tienda: { sum: tiendaSum, count: tiendaSales.length, percent: Math.round((tiendaSum / total) * 100) },
      otro: { sum: otroSum, count: otroSales.length, percent: Math.round((otroSum / total) * 100) }
    };
  }, [monthSales, totalMonthSales]);

  // Personal user budget & sales progress
  const currentUserBudget = useMemo(() => {
    return rawMonthBudgets.find(b => b.sellerId === currentUser.id);
  }, [rawMonthBudgets, currentUser]);

  const currentUserSales = useMemo(() => {
    return rawMonthSales
      .filter(s => s.sellerId === currentUser.id)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [rawMonthSales, currentUser]);

  const currentUserProgress = currentUserBudget 
    ? Math.min(100, Math.round((currentUserSales / currentUserBudget.targetAmount) * 100))
    : 0;

  // Table Sales Filtered
  const filteredDailySales = useMemo(() => {
    return monthSales.filter(s => {
      const matchChannel = selectedChannelFilter === 'all' || s.channel === selectedChannelFilter;
      const matchSeller = isSellerOnly || selectedSellerFilter === 'all' || s.sellerId === selectedSellerFilter;
      const matchStore = selectedStoreFilter === 'all' || s.storeId === selectedStoreFilter;
      const matchSearch = searchQuery === '' || 
        s.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.storeName && s.storeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.clientName && s.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchChannel && matchSeller && matchStore && matchSearch;
    });
  }, [monthSales, selectedChannelFilter, selectedSellerFilter, selectedStoreFilter, searchQuery, isSellerOnly]);

  // Export CSV Handler
  const handleExportSalesCSV = () => {
    const headers = ['ID Venta', 'Fecha', 'Sede/Tienda', 'ID Vendedor', 'Vendedor', 'Canal/Medio', 'Monto COP', 'Cliente', 'Descripción', 'Hora Registro'];
    const rows = filteredDailySales.map(s => [
      s.id,
      s.date,
      `"${s.storeName || 'Sin Sede'}"`,
      s.sellerId,
      `"${s.sellerName}"`,
      getChannelLabel(s.channel),
      s.amount,
      `"${s.clientName || ''}"`,
      `"${s.description || ''}"`,
      `"${s.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_Stoners_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Control de Presupuestos y Ventas Diarias
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Ventas POS & WP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {isAdmin 
              ? 'Asignación de cuotas mensuales, registro de ventas diarias por canal (WhatsApp, Tienda, Otro) y analítica de desempeño del equipo.'
              : 'Bitácora personal de ventas diarias por canal (WhatsApp, Tienda, Otro) y seguimiento de tu meta mensual.'
            }
          </p>
        </div>

        {/* Header Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-neutral-200">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mes:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setBudgetToEdit(null);
                setIsSetBudgetOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-teal-950/20"
            >
              <Target className="h-4 w-4" />
              <span>Asignar Presupuesto</span>
            </button>
          )}

          <button
            onClick={() => {
              setSaleToEdit(null);
              setIsAddSaleOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-emerald-950/20"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Venta Diaria</span>
          </button>
        </div>
      </div>

      {/* Personal Progress Banner (If Current User Has Budget) */}
      {currentUserBudget && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 dark:border-emerald-900/50 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-neutral-950 dark:to-neutral-950 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-12 w-12 rounded-2xl object-cover ring-2 ring-emerald-500/40"
                />
              ) : (
                <UserAvatar name={currentUser.name} role={currentUser.role} size="lg" className="rounded-2xl h-12 w-12 text-sm" />
              )}
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Tu Desempeño este Mes ({selectedMonth})
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hola, {currentUser.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Presupuesto objetivo: <strong className="text-slate-900 dark:text-white">{formatCOP(currentUserBudget.targetAmount)}</strong>
                </p>
              </div>
            </div>

            {/* Progress Metrics & Action */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-64 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-neutral-400">Vendido: {formatCOP(currentUserSales)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{currentUserProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentUserProgress >= 100 
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                        : currentUserProgress >= 70 
                        ? 'bg-teal-500' 
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, currentUserProgress)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 text-right font-medium">
                  {currentUserSales >= currentUserBudget.targetAmount
                    ? '🎉 ¡Meta mensual superada!'
                    : `Faltan ${formatCOP(currentUserBudget.targetAmount - currentUserSales)}`
                  }
                </p>
              </div>

              {onOpenAIModal && (
                <button
                  onClick={() => onOpenAIModal('¿Cuánto dinero y cuántas ventas me faltan para cumplir la meta?')}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-950/20 transition-all"
                >
                  <Sparkles className="h-4 w-4 text-teal-200 animate-pulse" />
                  <span>Preguntar a la IA</span>
                </button>
              )}

              <button
                onClick={() => {
                  setSaleToEdit(null);
                  setIsAddSaleOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Venta (+)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Month KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Budget */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>{isAdmin ? 'Presupuesto Total Mes' : 'Mi Presupuesto Objetivo'}</span>
            <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">
            {formatCOP(totalMonthBudget)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            {isAdmin ? `${monthBudgets.length} Vendedores con meta asignada` : 'Cuota de ventas personal'}
          </span>
        </div>

        {/* Total Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>{isAdmin ? 'Ventas Totales Registradas' : 'Mis Ventas Registradas'}</span>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
            {formatCOP(totalMonthSales)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            {isAdmin ? `${monthSales.length} Operaciones registradas` : `${monthSales.length} Transacciones este mes`}
          </span>
        </div>

        {/* Global Progress % */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>{isAdmin ? 'Cumplimiento Global' : 'Mi Cumplimiento'}</span>
            <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {overallProgressPercent}%
            </p>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
              {isAdmin ? 'de la cuota global' : 'de tu meta asignada'}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, overallProgressPercent)}%` }} 
            />
          </div>
        </div>

        {/* Main Channel */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>{isAdmin ? 'Canal Principal (Equipo)' : 'Mi Canal Principal'}</span>
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">
            {channelBreakdown.wp.sum >= channelBreakdown.tienda.sum ? 'WhatsApp (WP)' : 'En Tienda'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            {channelBreakdown.wp.sum >= channelBreakdown.tienda.sum 
              ? `${channelBreakdown.wp.percent}% del volumen` 
              : `${channelBreakdown.tienda.percent}% del volumen`
            }
          </span>
        </div>

      </div>

      {/* Breakdown by Sales Medium (WhatsApp vs En Tienda vs Otro) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isAdmin ? 'Ventas por Canal de Distribución (Global)' : 'Mis Ventas por Canal (WhatsApp / Tienda / Otro)'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* WhatsApp Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Ventas por WhatsApp</h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">Pedidos remotos y domicilios</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                {channelBreakdown.wp.percent}%
              </span>
            </div>

            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCOP(channelBreakdown.wp.sum)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-neutral-400 border-t border-emerald-200/60 dark:border-emerald-900/30 pt-2">
              <span>{channelBreakdown.wp.count} Transacciones</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Canal Digital</span>
            </div>
          </div>

          {/* En Tienda Card */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 dark:border-teal-900/40 dark:bg-teal-950/20 p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Ventas En Tienda</h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">Punto de venta físico / POS</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400">
                {channelBreakdown.tienda.percent}%
              </span>
            </div>

            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCOP(channelBreakdown.tienda.sum)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-neutral-400 border-t border-teal-200/60 dark:border-teal-900/30 pt-2">
              <span>{channelBreakdown.tienda.count} Transacciones</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">Atención Presencial</span>
            </div>
          </div>

          {/* Otro Medio Card */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 p-4 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Otro Medio de Venta</h4>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400">Ferias, llamadas, alianzas</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                {channelBreakdown.otro.percent}%
              </span>
            </div>

            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCOP(channelBreakdown.otro.sum)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-neutral-400 border-t border-indigo-200/60 dark:border-indigo-900/30 pt-2">
              <span>{channelBreakdown.otro.count} Transacciones</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">Canal Alterno</span>
            </div>
          </div>

        </div>
      </div>

      {/* Seller Performance Cards (Tabla de Vendedores & Presupuestos) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAdmin 
                ? `Presupuestos y Avance de Vendedores (${selectedMonth})` 
                : `Mi Presupuesto y Avance Personal (${selectedMonth})`
              }
            </span>
          </h3>

          {isAdmin && (
            <button
              onClick={() => {
                setBudgetToEdit(null);
                setIsSetBudgetOpen(true);
              }}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Asignar Presupuesto A Vendedor</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedSellers.map((seller) => {
            const budget = monthBudgets.find(b => b.sellerId === seller.id);
            const sellerSalesList = monthSales.filter(s => s.sellerId === seller.id);
            const totalSellerSold = sellerSalesList.reduce((sum, s) => sum + s.amount, 0);

            const wpAmount = sellerSalesList.filter(s => s.channel === 'whatsapp').reduce((sum, s) => sum + s.amount, 0);
            const tiendaAmount = sellerSalesList.filter(s => s.channel === 'tienda').reduce((sum, s) => sum + s.amount, 0);
            const otroAmount = sellerSalesList.filter(s => s.channel === 'otro').reduce((sum, s) => sum + s.amount, 0);

            const progress = budget ? Math.round((totalSellerSold / budget.targetAmount) * 100) : 0;

            return (
              <div 
                key={seller.id}
                className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-neutral-700 transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {seller.avatar && seller.avatar.trim() !== '' ? (
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-neutral-800"
                      />
                    ) : (
                      <UserAvatar name={seller.name} role={seller.role} size="md" className="rounded-xl h-10 w-10 text-xs" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{seller.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 capitalize">{seller.role} • {seller.department}</p>
                    </div>
                  </div>

                  {budget ? (
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      progress >= 100 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                        : progress >= 70
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {progress >= 100 ? 'Meta Cumplida' : progress >= 70 ? 'En Buen Camino' : 'Requiere Impulso'}
                    </span>
                  ) : (
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-neutral-900 dark:text-neutral-500 border border-slate-200 dark:border-neutral-800">
                      Sin Meta Asignada
                    </span>
                  )}
                </div>

                {/* Progress bar and amounts */}
                {budget ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-neutral-400">
                        Vendido: <strong className="text-slate-900 dark:text-white">{formatCOP(totalSellerSold)}</strong>
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatCOP(budget.targetAmount)} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    {budget.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 italic">
                        "{budget.notes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 dark:bg-neutral-900/60 p-3 text-xs text-slate-500 dark:text-neutral-400 flex items-center justify-between">
                    <span>Ventas registradas este mes: <strong>{formatCOP(totalSellerSold)}</strong></span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setBudgetToEdit({
                            id: '',
                            sellerId: seller.id,
                            sellerName: seller.name,
                            month: selectedMonth,
                            targetAmount: 15000000
                          });
                          setIsSetBudgetOpen(true);
                        }}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        + Crear Meta
                      </button>
                    )}
                  </div>
                )}

                {/* Medium breakdown badges for seller */}
                <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-slate-100 dark:border-neutral-900">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-1.5 text-center">
                    <span className="text-slate-500 dark:text-neutral-400 font-medium block">WP</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{formatCOP(wpAmount)}</strong>
                  </div>

                  <div className="rounded-lg bg-teal-50 dark:bg-teal-950/40 p-1.5 text-center">
                    <span className="text-slate-500 dark:text-neutral-400 font-medium block">Tienda</span>
                    <strong className="text-teal-700 dark:text-teal-400">{formatCOP(tiendaAmount)}</strong>
                  </div>

                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-1.5 text-center">
                    <span className="text-slate-500 dark:text-neutral-400 font-medium block">Otro</span>
                    <strong className="text-indigo-700 dark:text-indigo-400">{formatCOP(otroAmount)}</strong>
                  </div>
                </div>

                {/* Admin controls for budget */}
                {isAdmin && budget && (
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setBudgetToEdit(budget);
                        setIsSetBudgetOpen(true);
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Editar Presupuesto</span>
                    </button>
                    <button
                      onClick={() => deleteSalesBudget(budget.id)}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Sales Register Table (Bitácora de Ventas Diarias) */}
      <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6 shadow-sm space-y-4">
        
        {/* Filter Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-900 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isAdmin 
                  ? `Bitácora de Ventas Diarias (${selectedMonth})` 
                  : `Mi Bitácora de Ventas Diarias (${selectedMonth})`
                }
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {isAdmin 
                ? 'Historial detallado de transacciones ingresadas por vendedor y canal' 
                : 'Historial de tus ventas diarias registradas'
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder={isAdmin ? "Buscar cliente, nota o vendedor..." : "Buscar por cliente o nota..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filter by Channel */}
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs text-slate-800 dark:text-neutral-200 focus:border-emerald-500 focus:outline-none font-medium"
            >
              <option value="all">Todos los Canales</option>
              <option value="whatsapp">WhatsApp (WP)</option>
              <option value="tienda">En Tienda</option>
              <option value="otro">Otro Medio</option>
            </select>

            {/* Filter by Store */}
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs text-slate-800 dark:text-neutral-200 focus:border-emerald-500 focus:outline-none font-medium"
            >
              <option value="all">Todas las Sedes</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name} ({st.city})</option>
              ))}
            </select>

            {/* Filter by Seller (Admin / Supervisor only) */}
            {isAdmin && (
              <select
                value={selectedSellerFilter}
                onChange={(e) => setSelectedSellerFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs text-slate-800 dark:text-neutral-200 focus:border-emerald-500 focus:outline-none font-medium"
              >
                <option value="all">Todos los Vendedores</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}

            {/* Export CSV button */}
            <button
              onClick={handleExportSalesCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

          </div>
        </div>

        {/* Table Content */}
        {filteredDailySales.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <DollarSign className="h-10 w-10 text-slate-300 dark:text-neutral-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-neutral-300">No se encontraron ventas con los filtros aplicados</h4>
            <p className="text-xs text-slate-500 dark:text-neutral-500">Prueba cambiando el mes o seleccionando otro canal de venta.</p>
            <button
              onClick={() => {
                setSaleToEdit(null);
                setIsAddSaleOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-emerald-950/20"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Primera Venta</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-900 text-slate-400 dark:text-neutral-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-2">Fecha</th>
                  <th className="pb-3 px-2">Sede / Tienda</th>
                  <th className="pb-3 px-2">Vendedor</th>
                  <th className="pb-3 px-2">Canal / Medio</th>
                  <th className="pb-3 px-2">Monto ($ COP)</th>
                  <th className="pb-3 px-2">Cliente / Detalle</th>
                  <th className="pb-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {filteredDailySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {sale.date}
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40">
                        {sale.storeName || 'Sede General'}
                      </span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">{sale.sellerName}</span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      {sale.channel === 'whatsapp' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp (WP)</span>
                        </span>
                      )}
                      {sale.channel === 'tienda' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 px-2 py-0.5 text-[10px] font-bold">
                          <Store className="h-3 w-3" />
                          <span>En Tienda</span>
                        </span>
                      )}
                      {sale.channel === 'otro' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold">
                          <Globe className="h-3 w-3" />
                          <span>Otro Medio</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 font-extrabold text-emerald-700 dark:text-emerald-400 text-sm whitespace-nowrap">
                      {formatCOP(sale.amount)}
                    </td>

                    <td className="py-3 px-2 max-w-xs">
                      {sale.clientName && (
                        <span className="font-bold text-slate-900 dark:text-white block">{sale.clientName}</span>
                      )}
                      <span className="text-slate-500 dark:text-neutral-400 text-[11px] truncate block">
                        {sale.description || 'Sin detalles'}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {(currentUser.role === 'admin' || currentUser.id === sale.sellerId) && (
                          <button
                            onClick={() => {
                              setSaleToEdit(sale);
                              setIsAddSaleOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors"
                            title="Editar venta"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(currentUser.role === 'admin' || currentUser.id === sale.sellerId) && (
                          <button
                            onClick={() => deleteDailySale(sale.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Render Modals */}
      <AddSaleModal
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
        saleToEdit={saleToEdit}
      />

      <SetBudgetModal
        isOpen={isSetBudgetOpen}
        onClose={() => setIsSetBudgetOpen(false)}
        budgetToEdit={budgetToEdit}
      />

    </div>
  );
};
