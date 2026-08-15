import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../UserAvatar';
import { Store, User } from '../../types';
import { 
  Building2, 
  MapPin, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  X, 
  Search, 
  DollarSign, 
  Phone, 
  TrendingUp, 
  Store as StoreIcon,
  ShieldAlert,
  Check
} from 'lucide-react';

export const StoreList: React.FC = () => {
  const { stores, users, dailySales, salesBudgets, currentUser, addStore, updateStore, deleteStore, assignSellersToStore } = useApp();

  const isAdmin = currentUser.role === 'admin';

  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [storeToAssignSellers, setStoreToAssignSellers] = useState<Store | null>(null);
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: 'Pereira',
    code: '',
    address: '',
    phone: '',
    active: true
  });

  const citiesList = ['Pereira', 'Medellín', 'Manizales', 'Armenia'];

  // Current Month sales calculations
  const currentMonth = new Date().toISOString().substring(0, 7); // '2026-08'
  const monthSales = dailySales.filter(s => s.date.startsWith(currentMonth));

  // Filter stores
  const filteredStores = stores.filter(store => {
    const matchesCity = selectedCityFilter === 'all' || store.city.toLowerCase() === selectedCityFilter.toLowerCase();
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // Calculate totals
  const totalStores = stores.length;
  const uniqueCitiesCount = Array.from(new Set(stores.map(s => s.city))).length;
  const totalAssignedSellers = Array.from(new Set(stores.flatMap(s => s.assignedSellerIds))).length;

  const handleOpenAssignModal = (store: Store) => {
    setStoreToAssignSellers(store);
    setSelectedSellerIds(store.assignedSellerIds || []);
  };

  const handleSaveAssignments = () => {
    if (!storeToAssignSellers) return;
    assignSellersToStore(storeToAssignSellers.id, selectedSellerIds);
    setStoreToAssignSellers(null);
  };

  const handleToggleSellerInModal = (sellerId: string) => {
    setSelectedSellerIds(prev => 
      prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]
    );
  };

  const handleOpenCreateModal = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      city: 'Pereira',
      code: `STR-${Math.floor(100 + Math.random() * 900)}`,
      address: '',
      phone: '',
      active: true
    });
    setIsStoreModalOpen(true);
  };

  const handleOpenEditModal = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      city: store.city,
      code: store.code,
      address: store.address,
      phone: store.phone || '',
      active: store.active
    });
    setIsStoreModalOpen(true);
  };

  const handleSubmitStoreForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) return;

    if (editingStore) {
      updateStore(editingStore.id, {
        name: formData.name,
        city: formData.city,
        code: formData.code,
        address: formData.address,
        phone: formData.phone,
        active: formData.active
      });
    } else {
      addStore({
        name: formData.name,
        city: formData.city,
        code: formData.code || `STR-${Math.floor(100 + Math.random() * 900)}`,
        address: formData.address,
        phone: formData.phone,
        assignedSellerIds: [],
        active: formData.active
      });
    }
    setIsStoreModalOpen(false);
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get eligible sellers list (role === 'vendedor' or sales department)
  const sellersList = users.filter(u => u.role === 'vendedor' || u.department === 'sales' || u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Gestión de Sedes y Puntos de Venta
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Tiendas por Ciudad y Asignación de Vendedores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Administración de tiendas en Pereira, Medellín, Manizales y Armenia con control de personal asignado.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Nueva Sede</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>Tiendas Registradas</span>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalStores}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Puntos físicos habilitados
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>Ciudades Atendidas</span>
            <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {uniqueCitiesCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Pereira, Medellín, Manizales, Armenia
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>Vendedores Asignados</span>
            <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalAssignedSellers}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Personal comercial activo
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-bold">
            <span>Ventas Globales Mes</span>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 truncate">
            {formatCOP(monthSales.reduce((acc, s) => acc + s.amount, 0))}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            {monthSales.length} Operaciones registradas
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/70 dark:bg-neutral-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5 ml-1 mr-1">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ciudad:</span>
          </span>
          <button
            onClick={() => setSelectedCityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCityFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
            }`}
          >
            Todas ({stores.length})
          </button>
          {citiesList.map(city => {
            const count = stores.filter(s => s.city.toLowerCase() === city.toLowerCase()).length;
            return (
              <button
                key={city}
                onClick={() => setSelectedCityFilter(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCityFilter === city
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                }`}
              >
                {city} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por sede o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStores.map(store => {
          // Assigned sellers
          const assignedSellers = users.filter(u => store.assignedSellerIds?.includes(u.id));
          
          // Store sales this month
          const storeSales = monthSales.filter(s => s.storeId === store.id || assignedSellers.some(sel => sel.id === s.sellerId));
          const totalStoreSalesAmount = storeSales.reduce((sum, s) => sum + s.amount, 0);

          // Store budgets
          const storeBudgets = salesBudgets.filter(b => b.month === currentMonth && (b.storeId === store.id || assignedSellers.some(sel => sel.id === b.sellerId)));
          const totalStoreTarget = storeBudgets.reduce((sum, b) => sum + b.targetAmount, 0);
          const storeProgress = totalStoreTarget > 0 ? Math.min(Math.round((totalStoreSalesAmount / totalStoreTarget) * 100), 100) : 0;

          return (
            <div 
              key={store.id}
              className="group rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Store Badge & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50">
                      <MapPin className="h-3 w-3" />
                      {store.city}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-emerald-600 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                      Código: {store.code}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(store)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:text-neutral-500 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Editar información de sede"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la sede ${store.name}?`)) {
                            deleteStore(store.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Eliminar sede"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Address & Contact info */}
                <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-neutral-300">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </p>
                  {store.phone && (
                    <p className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
                      <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 flex-shrink-0" />
                      <span>{store.phone}</span>
                    </p>
                  )}
                </div>

                {/* Performance Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-900 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-neutral-400">Ventas Registradas Sede:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatCOP(totalStoreSalesAmount)}</span>
                  </div>
                  {totalStoreTarget > 0 && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                        <span>Meta Sede: {formatCOP(totalStoreTarget)}</span>
                        <span className="font-bold text-slate-700 dark:text-neutral-300">{storeProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${storeProgress}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Sellers List */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      Vendedores Asignados ({assignedSellers.length})
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenAssignModal(store)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Asignar</span>
                      </button>
                    )}
                  </div>

                  {assignedSellers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assignedSellers.map(seller => (
                        <div 
                          key={seller.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 text-xs font-medium text-slate-800 dark:text-neutral-200"
                        >
                          <UserAvatar name={seller.name} role={seller.role} size="xs" />
                          <span className="truncate max-w-[120px]">{seller.name.split(' ')[0]}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-neutral-400">
                            {seller.role === 'vendedor' ? 'Vend' : seller.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-amber-600 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Sin vendedores asignados a esta tienda</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {isAdmin && (
                <button
                  onClick={() => handleOpenAssignModal(store)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Gestionar Vendedores de {store.name}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Assign Sellers to Store */}
      {storeToAssignSellers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  {storeToAssignSellers.city}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  Asignar Vendedores a Sede
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {storeToAssignSellers.name} ({storeToAssignSellers.code})
                </p>
              </div>
              <button
                onClick={() => setStoreToAssignSellers(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                Selecciona uno o más vendedores para esta tienda:
              </p>

              {sellersList.map(seller => {
                const isSelected = selectedSellerIds.includes(seller.id);
                // check what other stores seller belongs to
                const otherStores = stores.filter(s => s.id !== storeToAssignSellers.id && s.assignedSellerIds?.includes(seller.id));

                return (
                  <div
                    key={seller.id}
                    onClick={() => handleToggleSellerInModal(seller.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={seller.name} role={seller.role} size="md" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {seller.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                          {seller.role === 'vendedor' ? 'Vendedor de Planta' : seller.role} • {seller.email}
                        </p>
                        {otherStores.length > 0 && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                            También en: {otherStores.map(s => s.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-900">
              <button
                onClick={() => setStoreToAssignSellers(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAssignments}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
              >
                Guardar Asignaciones ({selectedSellerIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Store */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form 
            onSubmit={handleSubmitStoreForm}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editingStore ? 'Editar Información de Sede' : 'Registrar Nueva Sede'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Ingresa los detalles de la tienda o punto de venta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  Ciudad *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-medium"
                >
                  <option value="Pereira">Pereira</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Manizales">Manizales</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Otra">Otra Ciudad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  Nombre de la Sede / Tienda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pereira - Invico o Medellín - Poblado"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: STR-PEI-01"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+57 606 324 5500"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  Dirección Física *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Circunvalar #12-45, Invico"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-900">
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
              >
                {editingStore ? 'Guardar Cambios' : 'Crear Sede'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
