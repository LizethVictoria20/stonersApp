import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, User as UserIcon, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesBudget } from '../../types';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: SalesBudget | null;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit
}) => {
  const { currentUser, users, stores, addOrUpdateSalesBudget } = useApp();

  const [sellerId, setSellerId] = useState(users[0]?.id || '');
  const [storeId, setStoreId] = useState<string>('');
  const [month, setMonth] = useState('2026-08');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (budgetToEdit) {
      setSellerId(budgetToEdit.sellerId);
      setStoreId(budgetToEdit.storeId || (stores[0]?.id ?? ''));
      setMonth(budgetToEdit.month);
      setTargetAmount(budgetToEdit.targetAmount);
      setNotes(budgetToEdit.notes || '');
    } else {
      if (users.length > 0) setSellerId(users[0].id);
      setStoreId(stores[0]?.id || '');
      setMonth('2026-08');
      setTargetAmount('');
      setNotes('');
    }
  }, [budgetToEdit, isOpen, users, stores]);

  const isAdmin = currentUser.role === 'admin';

  if (!isOpen || !isAdmin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAmount || Number(targetAmount) <= 0 || !sellerId) return;

    const selectedSeller = users.find(u => u.id === sellerId);
    if (!selectedSeller) return;

    const selectedStore = stores.find(s => s.id === storeId);

    addOrUpdateSalesBudget({
      sellerId: selectedSeller.id,
      sellerName: selectedSeller.name,
      storeId: selectedStore?.id,
      storeName: selectedStore?.name,
      month,
      targetAmount: Number(targetAmount),
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {budgetToEdit ? 'Modificar Presupuesto' : 'Asignar Presupuesto Mensual'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Establece la meta de ventas mensual para cada vendedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900 dark:text-neutral-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Select Seller */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Seleccionar Vendedor / Colaborador
            </label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Select Store */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Sede / Tienda Asociada
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:outline-none"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.city})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                Mes Correspondiente
              </label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
                Presupuesto Objetivo ($ COP)
              </label>
              <input
                type="number"
                required
                min="100000"
                step="100000"
                placeholder="Ej: 15000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-extrabold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Presupuesto Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Metas típicas:</span>
            {[10000000, 15000000, 20000000, 25000000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setTargetAmount(val)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-neutral-800 transition-colors"
              >
                ${(val / 1000000).toFixed(0)}M COP
              </button>
            ))}
          </div>

          {/* Notes / Strategy */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
              Observaciones o Estrategia Mensual (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Enfoque en ventas por WhatsApp durante promociones de mitad de mes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 px-4 py-2 font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 px-5 py-2 font-extrabold text-white transition-all shadow-lg shadow-teal-950/20 dark:shadow-teal-950/50"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Presupuesto</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
