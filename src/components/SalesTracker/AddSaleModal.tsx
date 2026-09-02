import React, { useState, useEffect } from 'react';
import { X, DollarSign, MessageCircle, Store, Globe, Calendar, User as UserIcon, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesChannel, DailySale, SaleItem } from '../../types';

interface CartLine {
  variantId: string;
  quantity: number;
  discountAmount: number;
}

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
  const {
    currentUser, users, stores, addDailySale, updateDailySale, products,
    productVariants, productPrices, inventory,
  } = useApp();
  const selectableStores = stores.filter(store => store.active && (
    currentUser.role === 'admin'
    || currentUser.role === 'contador'
    || currentUser.storeIds?.includes(store.id)
    || store.assignedSellerIds?.includes(currentUser.id)
  ));

  const [sellerId, setSellerId] = useState(currentUser.id);
  const [storeId, setStoreId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [channel, setChannel] = useState<SalesChannel>('tienda');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [cartLines, setCartLines] = useState<CartLine[]>([]);

  useEffect(() => {
    if (saleToEdit) {
      setSellerId(saleToEdit.sellerId);
      setStoreId(saleToEdit.storeId || (selectableStores[0]?.id ?? ''));
      setDate(saleToEdit.date);
      setAmount(saleToEdit.amount);
      setChannel(saleToEdit.channel);
      setClientName(saleToEdit.clientName || '');
      setDescription(saleToEdit.description || '');
      setCartLines((saleToEdit.items || []).map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
      })));
    } else {
      setSellerId(currentUser.id);
      // Auto pick user's first assigned store if available, else first store
      setStoreId(selectableStores[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setChannel('tienda');
      setClientName('');
      setDescription('');
      setCartLines([]);
    }
  }, [saleToEdit, isOpen, currentUser, stores]);

  const availableFor = (variantId: string) => {
    const current = inventory.find(item => item.storeId === storeId && item.variantId === variantId);
    const restoredFromEdit = saleToEdit?.storeId === storeId
      ? saleToEdit.items?.find(item => item.variantId === variantId)?.quantity || 0
      : 0;
    return Math.max(0, (current?.quantity || 0) - (current?.reservedQuantity || 0) + restoredFromEdit);
  };

  const catalogVariants = productVariants.filter(variant => {
    const product = products.find(item => item.id === variant.productId);
    const hasPriceForStore = productPrices.some(price => (
      price.variantId === variant.id && (price.storeId === storeId || !price.storeId)
    ));
    return variant.active && product?.status === 'active' && hasPriceForStore;
  });

  const availableVariants = catalogVariants.filter(variant => (
    availableFor(variant.id) > 0
    && !cartLines.some(line => line.variantId === variant.id)
  ));

  const cartItems: SaleItem[] = cartLines.flatMap(line => {
    const variant = productVariants.find(item => item.id === line.variantId);
    const product = variant ? products.find(item => item.id === variant.productId) : undefined;
    const price = productPrices.find(item => item.variantId === line.variantId && item.storeId === storeId)
      || productPrices.find(item => item.variantId === line.variantId && !item.storeId);
    if (!variant || !product || !price) return [];
    const subtotal = price.salePrice * line.quantity;
    const discountAmount = Math.min(subtotal, Math.max(0, line.discountAmount));
    const taxAmount = Math.round((subtotal - discountAmount) * ((price.taxRate ?? product.taxRate) / 100));
    return [{ productId: product.id, variantId: variant.id, productName: product.name, variantName: variant.name, sku: variant.sku, quantity: line.quantity, unitPrice: price.salePrice, unitCost: price.cost || 0, discountAmount, taxAmount, subtotal }];
  });
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cartDiscount = cartItems.reduce((sum, item) => sum + item.discountAmount, 0);
  const cartTax = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const cartTotal = cartSubtotal - cartDiscount + cartTax;

  const addProductToCart = (variantId: string) => {
    if (!variantId || cartLines.some(line => line.variantId === variantId)) return;
    const candidate = catalogVariants.find(variant => variant.id === variantId);
    if (candidate && availableFor(candidate.id) > 0) {
      setCartLines(prev => [...prev, { variantId: candidate.id, quantity: 1, discountAmount: 0 }]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = cartItems.length ? cartTotal : Number(amount);
    if (!finalAmount || finalAmount <= 0) return;

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
        amount: finalAmount,
        channel,
        clientName,
        description,
        items: cartItems,
        subtotal: cartItems.length ? cartSubtotal : undefined,
        discountAmount: cartItems.length ? cartDiscount : undefined,
        taxAmount: cartItems.length ? cartTax : undefined,
      });
    } else {
      addDailySale({
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name,
        storeId: selectedStore?.id,
        storeName: selectedStore?.name,
        date,
        amount: finalAmount,
        channel,
        clientName,
        description,
        items: cartItems,
        subtotal: cartItems.length ? cartSubtotal : undefined,
        discountAmount: cartItems.length ? cartDiscount : undefined,
        taxAmount: cartItems.length ? cartTax : undefined,
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
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-2xl space-y-5">
        
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
                Selecciona productos; el total y el inventario se calculan automáticamente
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
              {selectableStores.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.city})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/10">
              <div className="mb-3">
                <label className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-white">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" /> Productos vendidos
                </label>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-neutral-400">
                  Selecciona un producto del inventario para agregarlo a la venta.
                </p>
              </div>

              <select
                value=""
                onChange={event => addProductToCart(event.target.value)}
                disabled={!storeId || availableVariants.length === 0}
                aria-label="Seleccionar producto del inventario"
                className="mb-3 w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/60 dark:bg-neutral-900 dark:text-white"
              >
                <option value="">
                  {!storeId
                    ? 'Primero selecciona una tienda'
                    : availableVariants.length > 0
                      ? 'Seleccionar producto...'
                      : 'No hay más productos con existencias disponibles'}
                </option>
                {catalogVariants.map(variant => {
                  const product = products.find(item => item.id === variant.productId);
                  const price = productPrices.find(item => item.variantId === variant.id && item.storeId === storeId)
                    || productPrices.find(item => item.variantId === variant.id && !item.storeId);
                  const stock = availableFor(variant.id);
                  const alreadyAdded = cartLines.some(line => line.variantId === variant.id);
                  return (
                    <option key={variant.id} value={variant.id} disabled={stock <= 0 || alreadyAdded}>
                      {product?.name} · {variant.name} · SKU {variant.sku} · ${Number(price?.salePrice || 0).toLocaleString('es-CO')} · {stock > 0 ? `${stock} disponibles` : 'Sin existencias'}{alreadyAdded ? ' · Ya agregado' : ''}
                    </option>
                  );
                })}
              </select>

              {products.length === 0 && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                  Aún no hay productos registrados. Agrégalos primero en Productos e inventario.
                </p>
              )}

              {products.length > 0 && catalogVariants.length === 0 && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                  Los productos necesitan una variante activa y un precio configurado para esta tienda.
                </p>
              )}

              <div className="space-y-2">
                {cartLines.map((line, index) => {
                  const stock = availableFor(line.variantId);
                  const price = productPrices.find(item => item.variantId === line.variantId && item.storeId === storeId)
                    || productPrices.find(item => item.variantId === line.variantId && !item.storeId);
                  return (
                    <div key={`${line.variantId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_70px_95px_32px] gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
                      <select value={line.variantId} onChange={e => setCartLines(prev => prev.map((item, lineIndex) => lineIndex === index ? { ...item, variantId: e.target.value, quantity: 1 } : item))} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] dark:border-neutral-700 dark:bg-neutral-950">
                        {catalogVariants.filter(variant => (variant.id === line.variantId || availableFor(variant.id) > 0) && (variant.id === line.variantId || !cartLines.some(item => item.variantId === variant.id))).map(variant => <option key={variant.id} value={variant.id}>{products.find(product => product.id === variant.productId)?.name} · {variant.sku}</option>)}
                      </select>
                      <input aria-label="Cantidad" title={`Disponible: ${stock}`} type="number" min="1" max={stock} value={line.quantity} onChange={e => setCartLines(prev => prev.map((item, lineIndex) => lineIndex === index ? { ...item, quantity: Math.max(1, Number(e.target.value)) } : item))} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] dark:border-neutral-700 dark:bg-neutral-950" />
                      <div className="rounded-lg bg-slate-50 px-2 py-1 text-right dark:bg-neutral-950"><p className="text-[9px] text-slate-400">{stock} disp.</p><p className="font-black">{new Intl.NumberFormat('es-CO').format((price?.salePrice || 0) * line.quantity)}</p></div>
                      <button type="button" onClick={() => setCartLines(prev => prev.filter((_, lineIndex) => lineIndex !== index))} className="flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 className="h-4 w-4" /></button>
                      <label className="col-span-4 flex items-center justify-end gap-2 text-[10px] text-slate-500">Descuento de esta línea (COP)<input type="number" min="0" max={(price?.salePrice || 0) * line.quantity} value={line.discountAmount} onChange={e => setCartLines(prev => prev.map((item, lineIndex) => lineIndex === index ? { ...item, discountAmount: Number(e.target.value) } : item))} className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-right dark:border-neutral-700 dark:bg-neutral-950" /></label>
                    </div>
                  );
                })}
                {!cartLines.length && <p className="py-3 text-center text-[11px] text-slate-500">Agrega los productos de la venta. Si no usas catálogo, aún puedes ingresar un monto manual.</p>}
              </div>
              {cartLines.length > 0 && <div className="mt-3 grid grid-cols-4 gap-2 border-t border-emerald-200 pt-3 text-right dark:border-emerald-900/50"><div><p className="text-[9px] uppercase text-slate-400">Subtotal</p><p className="font-bold">${cartSubtotal.toLocaleString('es-CO')}</p></div><div><p className="text-[9px] uppercase text-slate-400">Descuento</p><p className="font-bold text-rose-500">-${cartDiscount.toLocaleString('es-CO')}</p></div><div><p className="text-[9px] uppercase text-slate-400">IVA</p><p className="font-bold">${cartTax.toLocaleString('es-CO')}</p></div><div><p className="text-[9px] uppercase text-emerald-600">Total</p><p className="font-black text-emerald-700 dark:text-emerald-400">${cartTotal.toLocaleString('es-CO')}</p></div></div>}
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
                min="1"
                step="1000"
                placeholder="Ej: 350000"
                value={cartItems.length ? cartTotal : amount}
                readOnly={cartItems.length > 0}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2.5 text-slate-900 dark:text-white font-extrabold focus:border-emerald-500 focus:outline-none read-only:cursor-not-allowed read-only:opacity-70"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          {!cartItems.length && <div className="flex flex-wrap items-center gap-1.5">
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
          </div>}

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
