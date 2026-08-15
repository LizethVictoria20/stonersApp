import React, { useState, useEffect } from 'react';
import { X, DollarSign, MessageCircle, Store, Globe, Calendar, User as UserIcon, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesChannel, DailySale } from '../../types';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit?: DailySale | null;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  saleToEdit
}) => {
  const { currentUser, users, stores, addDailySale, updateDailySale } = useApp();

  const [sellerId, setSellerId] = useState(currentUser.id);
  const [storeId, setStoreId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [channel, setChannel] = useState<SalesChannel>('tienda');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (saleToEdit) {
      setSellerId(saleToEdit.sellerId);
      setStoreId(saleToEdit.storeId || (stores[0]?.id ?? ''));
      setDate(saleToEdit.date);
      setAmount(saleToEdit.amount);
      setChannel(saleToEdit.channel);
      setClientName(saleToEdit.clientName || '');
      setDescription(saleToEdit.description || '');
    } else {
      setSellerId(currentUser.id);
      // Auto pick user's first assigned store if available, else first store
      const userStores = stores.filter(s => currentUser.storeIds?.includes(s.id) || s.assignedSellerIds?.includes(currentUser.id));
      setStoreId(userStores[0]?.id || stores[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setChannel('tienda');
      setClientName('');
      setDescription('');
    }
  }, [saleToEdit, isOpen, currentUser, stores]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const isAdmin = currentUser.role === 'admin';
    const targetSellerId = isAdmin ? sellerId : currentUser.id;
    const selectedSeller = users.find(u => u.id === targetSellerId) || currentUser;

    const selectedStore = stores.find(s => s.id === storeId);

    if (saleToEdit) {
      updateDailySale(saleToEdit.id, {
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name,
        storeId: selectedStore?.id,
        storeName: selectedStore?.name,
        date,
        amount: Number(amount),
        channel,
        clientName,
        description
      });
    } else {
      addDailySale({
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name,
        storeId: selectedStore?.id,
        storeName: selectedStore?.name,
        date,
        amount: Number(amount),
        channel,
        clientName,
        description
      });
    }

    onClose();
  };

  const addQuickAmount = (val: number) => {
    const current = typeof amount === 'number' ? amount : 0;
    setAmount(current + val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {saleToEdit ? 'Editar Venta Registrada' : 'Registrar Venta Diaria'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Ingresa el monto vendido y el canal correspondiente
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
          
          {/* Seller Selection (Admin can choose, Seller is pre-selected) */}
          {currentUser.role === 'admin' ? (
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Vendedor / Colaborador
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 dark:bg-neutral-900/60 p-3 border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-slate-500 dark:text-neutral-400 font-medium">Vendedor Activo:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
            </div>
          )}

          {/* Store Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Sede / Tienda de Venta
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-medium"
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
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Fecha de la Venta
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Monto Vendido (COP)
              </label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="Ej: 350000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-extrabold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Rápido:</span>
            <button
              type="button"
              onClick={() => addQuickAmount(100000)}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 px-2 py-1 text-[11px] font-bold border border-slate-200 dark:border-neutral-800 transition-colors"
            >
              +$100.000
            </button>
            <button
              type="button"
              onClick={() => addQuickAmount(500000)}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 px-2 py-1 text-[11px] font-bold border border-slate-200 dark:border-neutral-800 transition-colors"
            >
              +$500.000
            </button>
            <button
              type="button"
              onClick={() => addQuickAmount(1000000)}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 px-2 py-1 text-[11px] font-bold border border-slate-200 dark:border-neutral-800 transition-colors"
            >
              +$1.000.000
            </button>
          </div>

          {/* Channel / Medium Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Canal / Medio de Venta
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  channel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <MessageCircle className="h-5 w-5 mb-1 text-emerald-600 dark:text-emerald-400" />
                <span className="font-extrabold text-[11px]">WhatsApp (WP)</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('tienda')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  channel === 'tienda'
                    ? 'border-teal-500 bg-teal-50/80 text-teal-800 dark:border-teal-500 dark:bg-teal-500/20 dark:text-teal-300 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <Store className="h-5 w-5 mb-1 text-teal-600 dark:text-teal-400" />
                <span className="font-extrabold text-[11px]">En Tienda</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('otro')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  channel === 'otro'
                    ? 'border-indigo-500 bg-indigo-50/80 text-indigo-800 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 hover:border-slate-300'
                }`}
              >
                <Globe className="h-5 w-5 mb-1 text-indigo-600 dark:text-indigo-400" />
                <span className="font-extrabold text-[11px]">Otro Medio</span>
              </button>
            </div>
          </div>

          {/* Optional Client Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
              Nombre de Cliente / Empresa (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez / Punto de venta norte"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Optional Details/Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
              Detalle del Producto o Notas (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: 30g Flores Colombia Gold + Tintura CBD..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
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
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 font-extrabold text-white transition-all shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50"
            >
              <Plus className="h-4 w-4" />
              <span>{saleToEdit ? 'Guardar Cambios' : 'Registrar Venta'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
