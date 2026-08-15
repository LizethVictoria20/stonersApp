import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Bot, BookOpen, CheckSquare, Loader2, DollarSign, Target, Repeat, TrendingUp, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiUrl } from '../lib/api';
import { formatCOP } from '../utils/formatters';

interface AIOpsAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const AIOpsAssistantModal: React.FC<AIOpsAssistantModalProps> = ({ isOpen, onClose, initialPrompt }) => {
  const { tasks, salesBudgets, dailySales, currentUser } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setPrompt(initialPrompt);
      handleAskAI(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  // Compute live context for currentUser
  const currentMonth = new Date().toISOString().substring(0, 7);
  const pendingTasks = tasks.filter(t => t.assignedToId === currentUser.id && t.status !== 'completed');
  const dailyTasks = pendingTasks.filter(t => t.isDaily);

  const pendingTasksSummary = pendingTasks.length > 0
    ? pendingTasks.map(t => `• [${t.code}] ${t.title} (Prioridad: ${t.priority}) ${t.isDaily ? '🔄 Tarea Diaria (6am-9pm)' : ''}`).join('\n')
    : '• No tienes tareas pendientes asignadas en este momento.';

  // Budget & Sales metrics
  const sellerBudgetObj = salesBudgets.find(b => b.sellerId === currentUser.id && b.month === currentMonth)
    || salesBudgets.find(b => b.sellerId === currentUser.id)
    || { targetAmount: 15000000 };

  const targetAmount = sellerBudgetObj ? sellerBudgetObj.targetAmount : 15000000;
  const sellerMonthSales = dailySales.filter(s => s.sellerId === currentUser.id && s.date.startsWith(currentMonth));
  const totalSales = sellerMonthSales.reduce((acc, s) => acc + s.amount, 0);
  const salesCount = sellerMonthSales.length;
  const avgTicket = salesCount > 0 ? Math.round(totalSales / salesCount) : 150000;
  const missingMoney = Math.max(0, targetAmount - totalSales);
  const missingSalesCount = Math.ceil(missingMoney / (avgTicket || 150000));
  const progressPercentage = targetAmount > 0 ? Math.round((totalSales / targetAmount) * 100) : 0;

  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemainingInMonth = Math.max(1, totalDaysInMonth - currentDay + 1);
  const requiredDailySalesAmount = Math.round(missingMoney / daysRemainingInMonth);

  const sellerContext = {
    userName: currentUser.name,
    userRole: currentUser.role,
    department: currentUser.department,
    pendingTasksCount: pendingTasks.length,
    pendingTasksSummary,
    salesBudgetFormatted: formatCOP(targetAmount),
    totalSalesFormatted: formatCOP(totalSales),
    progressPercentage,
    missingMoneyFormatted: formatCOP(missingMoney),
    avgTicketFormatted: formatCOP(avgTicket),
    missingSalesCount,
    salesCount,
    daysRemainingInMonth,
    requiredDailySalesAmountFormatted: formatCOP(requiredDailySalesAmount)
  };

  const handleAskAI = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    setLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch(apiUrl('/api/ai-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: textToSend, 
          actionType: 'general',
          contextData: sellerContext
        })
      });
      const data = await res.json();
      setAiResponse(data.result || 'Respuesta completada por el asistente virtual.');
    } catch (err: any) {
      setAiResponse('Error de conexión con el servicio de IA: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-teal-900/50 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto my-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-400 border border-teal-500/30">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Asistente Virtual e Inteligencia de Ventas</h3>
                <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-extrabold text-teal-300 border border-teal-500/30">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-neutral-400">Consultas de tareas pendientes, metas de ventas y estrategias para {currentUser.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-800 p-2 text-neutral-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Indicator Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Meta Mes:</span>
            <span className="font-extrabold text-white truncate block">{formatCOP(targetAmount)}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Dinero Faltante:</span>
            <span className="font-extrabold text-emerald-400 truncate block">{formatCOP(missingMoney)}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">Ventas Faltantes:</span>
            <span className="font-extrabold text-teal-300 truncate block">~{missingSalesCount} ventas</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Tareas Pendientes:</span>
            <span className="font-extrabold text-amber-300 truncate block">{pendingTasks.length} ({dailyTasks.length} diarias)</span>
          </div>
        </div>

        {/* Quick Prompt Presets for Sellers */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Consultas Rápidas para Vendedores:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                const p = '¿Qué tareas me hacen falta por hacer hoy y cuáles son mis tareas diarias activas?';
                setPrompt(p);
                handleAskAI(p);
              }}
              className="rounded-xl bg-neutral-900 hover:bg-teal-950 border border-neutral-800 hover:border-teal-700/60 p-2.5 text-left text-neutral-200 hover:text-teal-200 transition-all text-xs flex items-center gap-2 group"
            >
              <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold block">📋 Mis Tareas Pendientes</span>
                <span className="text-[10px] text-neutral-400 block truncate">Revisar lista de pendientes y diarias (6am-9pm)</span>
              </div>
            </button>

            <button
              onClick={() => {
                const p = '¿Cuánto dinero me falta exactamente para cumplir mi meta de ventas del mes?';
                setPrompt(p);
                handleAskAI(p);
              }}
              className="rounded-xl bg-neutral-900 hover:bg-teal-950 border border-neutral-800 hover:border-teal-700/60 p-2.5 text-left text-neutral-200 hover:text-teal-200 transition-all text-xs flex items-center gap-2 group"
            >
              <DollarSign className="h-4 w-4 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold block">💰 Dinero Faltante para la Meta</span>
                <span className="text-[10px] text-neutral-400 block truncate">Calcula la diferencia contra el presupuesto mensual</span>
              </div>
            </button>

            <button
              onClick={() => {
                const p = '¿Cuántas ventas me hacen falta realizar para alcanzar el objetivo y cuántas ventas por día debo hacer?';
                setPrompt(p);
                handleAskAI(p);
              }}
              className="rounded-xl bg-neutral-900 hover:bg-teal-950 border border-neutral-800 hover:border-teal-700/60 p-2.5 text-left text-neutral-200 hover:text-teal-200 transition-all text-xs flex items-center gap-2 group"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold block">🛍️ Cantidad de Ventas Faltantes</span>
                <span className="text-[10px] text-neutral-400 block truncate">Ventas estimadas en base a tu ticket promedio</span>
              </div>
            </button>

            <button
              onClick={() => {
                const p = 'Dame un plan de acción rápido y recomendaciones para cerrar mis ventas faltantes esta semana.';
                setPrompt(p);
                handleAskAI(p);
              }}
              className="rounded-xl bg-neutral-900 hover:bg-teal-950 border border-neutral-800 hover:border-teal-700/60 p-2.5 text-left text-neutral-200 hover:text-teal-200 transition-all text-xs flex items-center gap-2 group"
            >
              <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold block">🚀 Plan de Acción de Ventas</span>
                <span className="text-[10px] text-neutral-400 block truncate">Estrategia para impulsar WhatsApp y tienda</span>
              </div>
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-neutral-300">Escribe tu consulta personalizada:</label>
            <span className="text-[10px] text-neutral-500">Ejemplo: ¿Cómo voy en mis metas?</span>
          </div>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pregunta a la IA sobre tus tareas pendientes, dinero faltante, ventas requeridas o estrategias..."
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-3.5 text-xs text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
          />

          <button
            onClick={() => handleAskAI()}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 py-3 text-xs font-bold text-white hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-teal-950/60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                <span>Calculando y consultando con Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Preguntar a la IA de Operaciones</span>
              </>
            )}
          </button>
        </div>

        {/* AI Output Box */}
        {aiResponse && (
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-neutral-900 to-teal-950/40 border border-teal-700/50 text-xs text-neutral-100 space-y-3 animate-in fade-in shadow-xl">
            <div className="flex items-center justify-between border-b border-teal-900/40 pb-2.5">
              <div className="flex items-center gap-2 text-teal-300 font-extrabold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Respuesta del Asistente IA</span>
              </div>
              <span className="text-[10px] font-bold text-teal-400/80 uppercase tracking-wider">
                Datos En Vivo
              </span>
            </div>
            <div className="leading-relaxed whitespace-pre-line text-neutral-200 text-xs font-medium space-y-1">
              {aiResponse}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
