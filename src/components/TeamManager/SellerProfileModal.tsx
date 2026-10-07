import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, CalendarDays, CheckCircle2, CircleDollarSign, Lightbulb, Mail,
  MapPin, Phone, Save, Target, TrendingUp, UserRound, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DailySale, User } from '../../types';
import { formatCOP } from '../../utils/formatters';
import { UserAvatar } from '../UserAvatar';

interface SellerProfileModalProps {
  seller: User;
  onClose: () => void;
}

type PersonalDraft = Pick<User, 'name' | 'email' | 'phone' | 'documentNumber' | 'birthDate' | 'address' | 'city' | 'hireDate'>;

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white';
const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthLabel = (month: string) => new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(`${month}-02T12:00:00`));

const saleChannelLabel: Record<DailySale['channel'], string> = {
  whatsapp: 'WhatsApp',
  tienda: 'Tienda',
  otro: 'Otro',
};

export const SellerProfileModal: React.FC<SellerProfileModalProps> = ({ seller, onClose }) => {
  const { dailySales, salesBudgets, stores, updateUser, addOrUpdateSalesBudget } = useApp();
  const [month, setMonth] = useState(currentMonth());
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalAmount, setGoalAmount] = useState<number | ''>('');
  const [goalNotes, setGoalNotes] = useState('');
  const [draft, setDraft] = useState<PersonalDraft>({
    name: seller.name,
    email: seller.email,
    phone: seller.phone || '',
    documentNumber: seller.documentNumber || '',
    birthDate: seller.birthDate || '',
    address: seller.address || '',
    city: seller.city || '',
    hireDate: seller.hireDate || '',
  });

  const sellerSales = useMemo(() => dailySales
    .filter(sale => sale.sellerId === seller.id)
    .sort((a, b) => b.date.localeCompare(a.date)), [dailySales, seller.id]);
  const monthSales = useMemo(() => sellerSales.filter(sale => sale.date.startsWith(month)), [sellerSales, month]);
  const monthBudget = salesBudgets.find(budget => budget.sellerId === seller.id && budget.month === month);
  const soldAmount = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
  const targetAmount = monthBudget?.targetAmount || 0;
  const missingAmount = Math.max(0, targetAmount - soldAmount);
  const progress = targetAmount > 0 ? Math.round((soldAmount / targetAmount) * 100) : 0;
  const historicalAmount = sellerSales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageTicket = monthSales.length ? Math.round(soldAmount / monthSales.length) : 0;

  const monthlyResults = useMemo(() => {
    const months = new Set([
      ...sellerSales.map(sale => sale.date.slice(0, 7)),
      ...salesBudgets.filter(budget => budget.sellerId === seller.id).map(budget => budget.month),
    ]);
    return [...months].sort((a, b) => b.localeCompare(a)).map(resultMonth => {
      const sales = sellerSales.filter(sale => sale.date.startsWith(resultMonth)).reduce((sum, sale) => sum + sale.amount, 0);
      const target = salesBudgets.find(budget => budget.sellerId === seller.id && budget.month === resultMonth)?.targetAmount || 0;
      const percentage = target > 0 ? Math.round((sales / target) * 100) : 0;
      const status = target === 0 ? 'Sin meta' : sales >= target ? 'Alcanzada' : resultMonth >= currentMonth() ? 'Por cumplir' : 'No alcanzada';
      return { month: resultMonth, sales, target, percentage, status };
    });
  }, [salesBudgets, seller.id, sellerSales]);

  const goalsReached = monthlyResults.filter(result => result.status === 'Alcanzada').length;
  const goalsPending = monthlyResults.filter(result => result.status === 'Por cumplir').length;

  const recommendations = useMemo(() => {
    if (!targetAmount) return ['Define una meta mensual para poder calcular el ritmo de venta y generar recomendaciones medibles.'];
    if (soldAmount >= targetAmount) {
      return [
        `La meta está cumplida. Mantén el ticket promedio de ${formatCOP(averageTicket)} y prioriza clientes recurrentes.`,
        'Documenta los canales y productos que impulsaron el resultado para repetir la estrategia el próximo mes.',
      ];
    }

    const now = new Date();
    const [year, monthNumber] = month.split('-').map(Number);
    const isCurrent = month === currentMonth();
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const daysRemaining = isCurrent ? Math.max(1, lastDay - now.getDate() + 1) : lastDay;
    const dailyRequired = Math.ceil(missingAmount / daysRemaining);
    const channelTotals = monthSales.reduce<Record<DailySale['channel'], number>>((totals, sale) => {
      totals[sale.channel] += sale.amount;
      return totals;
    }, { whatsapp: 0, tienda: 0, otro: 0 });
    const strongestChannel = (Object.entries(channelTotals) as Array<[DailySale['channel'], number]>).sort((a, b) => b[1] - a[1])[0];
    const tips = [
      `Necesita vender aproximadamente ${formatCOP(dailyRequired)} por día para cubrir los ${formatCOP(missingAmount)} faltantes.`,
      averageTicket > 0
        ? `Con el ticket promedio actual de ${formatCOP(averageTicket)}, requiere cerca de ${Math.ceil(missingAmount / averageTicket)} ventas adicionales.`
        : 'Registra las primeras ventas del mes para calcular el ticket promedio y ajustar el plan.',
    ];
    if (strongestChannel?.[1] > 0) tips.push(`El canal con mejor resultado es ${saleChannelLabel[strongestChannel[0]]}; conviene reforzar el seguimiento comercial allí.`);
    if (progress < 50) tips.push('Prioriza contactos con intención de compra, seguimientos pendientes y productos de mayor valor para acelerar el avance.');
    return tips;
  }, [averageTicket, missingAmount, month, monthSales, progress, soldAmount, targetAmount]);

  useEffect(() => {
    setGoalAmount(monthBudget?.targetAmount || '');
    setGoalNotes(monthBudget?.notes || '');
  }, [month, monthBudget?.id, monthBudget?.notes, monthBudget?.targetAmount]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateUser(seller.id, draft);
      window.alert('Datos personales guardados en Supabase.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalAmount || goalAmount <= 0) return;
    setSavingGoal(true);
    try {
      await addOrUpdateSalesBudget({ sellerId: seller.id, sellerName: seller.name, month, targetAmount: Number(goalAmount), notes: goalNotes });
      window.alert('Meta mensual guardada en Supabase.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo guardar la meta.');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="flex items-center gap-3">
            <UserAvatar name={seller.name} role={seller.role} size="lg" />
            <div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Ficha comercial del vendedor</p><h2 className="text-xl font-black text-slate-950 dark:text-white">{seller.name}</h2></div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-900" aria-label="Cerrar ficha"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-black text-slate-900 dark:text-white">Periodo de análisis</p><p className="text-[11px] text-slate-500">Ventas y cumplimiento mensual</p></div>
            <input type="month" value={month} onChange={event => setMonth(event.target.value)} className={`${fieldClass} sm:w-52`} />
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Vendido', formatCOP(soldAmount), CircleDollarSign, 'text-emerald-600'],
              ['Meta de ventas', targetAmount ? formatCOP(targetAmount) : 'Sin definir', Target, 'text-indigo-600'],
              ['Cumplimiento', `${progress}%`, TrendingUp, progress >= 100 ? 'text-emerald-600' : 'text-amber-600'],
              ['Faltante', targetAmount ? formatCOP(missingAmount) : '—', CalendarDays, 'text-rose-500'],
            ].map(([label, value, Icon, color]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase text-slate-400">{String(label)}</p><Icon className={`h-4 w-4 ${color}`} /></div><p className={`mt-2 text-xl font-black ${color}`}>{String(value)}</p></article>)}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-2 flex items-center justify-between text-xs"><span className="font-bold">Avance de {monthLabel(month)}</span><span className="font-black text-emerald-600">{progress}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${Math.min(100, progress)}%` }} /></div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900 dark:text-white"><UserRound className="h-4 w-4 text-emerald-600" /> Datos personales básicos</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-bold text-slate-500">Nombre completo<input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500">Documento<input value={draft.documentNumber} onChange={event => setDraft({ ...draft, documentNumber: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500"><Mail className="mr-1 inline h-3 w-3" />Correo<input required type="email" value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500"><Phone className="mr-1 inline h-3 w-3" />Teléfono<input value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500">Fecha de nacimiento<input type="date" value={draft.birthDate} onChange={event => setDraft({ ...draft, birthDate: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500">Fecha de ingreso<input type="date" value={draft.hireDate} onChange={event => setDraft({ ...draft, hireDate: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500"><MapPin className="mr-1 inline h-3 w-3" />Ciudad<input value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} className={`${fieldClass} mt-1`} /></label>
                <label className="text-[10px] font-bold text-slate-500">Dirección<input value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} className={`${fieldClass} mt-1`} /></label>
              </div>
              <button disabled={savingProfile} className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{savingProfile ? 'Guardando…' : 'Guardar datos'}</button>
            </form>

            <div className="space-y-5">
              <form onSubmit={saveGoal} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900 dark:text-white"><Target className="h-4 w-4 text-indigo-600" /> Meta mensual</h3>
                <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold text-slate-500">Valor de la meta (COP)<input required type="number" min="1" value={goalAmount} onChange={event => setGoalAmount(event.target.value ? Number(event.target.value) : '')} className={`${fieldClass} mt-1`} /></label><label className="text-[10px] font-bold text-slate-500">Notas<input value={goalNotes} onChange={event => setGoalNotes(event.target.value)} placeholder="Prioridad o estrategia del mes" className={`${fieldClass} mt-1`} /></label></div>
                <button disabled={savingGoal} className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{monthBudget ? 'Actualizar meta' : 'Asignar meta'}</button>
              </form>

              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-amber-950/10">
                <h3 className="mb-3 flex items-center gap-2 font-black text-slate-900 dark:text-white"><Lightbulb className="h-4 w-4 text-amber-500" /> Recomendaciones para alcanzar la meta</h3>
                <ul className="space-y-2">{recommendations.map(tip => <li key={tip} className="flex gap-2 text-xs leading-relaxed text-slate-700 dark:text-neutral-300"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{tip}</li>)}</ul>
              </section>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-black"><Award className="h-4 w-4 text-emerald-600" /> Metas alcanzadas y por cumplir</h3><div className="flex gap-2 text-[10px] font-bold"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{goalsReached} alcanzadas</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">{goalsPending} por cumplir</span></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-slate-200 text-[10px] uppercase text-slate-400 dark:border-neutral-800"><tr><th className="p-2">Mes</th><th className="p-2">Vendido</th><th className="p-2">Meta</th><th className="p-2">Cumplimiento</th><th className="p-2">Faltante</th><th className="p-2">Estado</th></tr></thead><tbody>{monthlyResults.map(result => <tr key={result.month} className="border-b border-slate-100 dark:border-neutral-800"><td className="p-2 font-bold capitalize">{monthLabel(result.month)}</td><td className="p-2">{formatCOP(result.sales)}</td><td className="p-2">{result.target ? formatCOP(result.target) : '—'}</td><td className="p-2 font-black">{result.target ? `${result.percentage}%` : '—'}</td><td className="p-2">{result.target ? formatCOP(Math.max(0, result.target - result.sales)) : '—'}</td><td className="p-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${result.status === 'Alcanzada' ? 'bg-emerald-100 text-emerald-700' : result.status === 'Por cumplir' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{result.status}</span></td></tr>)}</tbody></table>{monthlyResults.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Todavía no hay metas ni ventas registradas.</p>}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-black">Histórico de ventas</h3><p className="text-xs text-slate-500">Total histórico: <strong className="text-emerald-600">{formatCOP(historicalAmount)}</strong></p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="border-b border-slate-200 text-[10px] uppercase text-slate-400 dark:border-neutral-800"><tr><th className="p-2">Fecha</th><th className="p-2">Sede</th><th className="p-2">Cliente</th><th className="p-2">Canal</th><th className="p-2 text-right">Valor</th></tr></thead><tbody>{sellerSales.slice(0, 100).map(sale => <tr key={sale.id} className="border-b border-slate-100 dark:border-neutral-800"><td className="p-2">{sale.date}</td><td className="p-2">{sale.storeName || stores.find(store => store.id === sale.storeId)?.name || 'Sin sede'}</td><td className="p-2">{sale.clientName || 'Sin registrar'}</td><td className="p-2">{saleChannelLabel[sale.channel]}</td><td className="p-2 text-right font-black text-emerald-600">{formatCOP(sale.amount)}</td></tr>)}</tbody></table>{sellerSales.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Este vendedor todavía no tiene ventas registradas.</p>}</div>
          </section>
        </div>
      </div>
    </div>
  );
};
