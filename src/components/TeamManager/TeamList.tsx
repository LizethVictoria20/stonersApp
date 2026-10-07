import React, { useState } from 'react';
import { Users, Plus, Shield, Phone, Mail, Award, CheckCircle2, KeyRound, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../UserAvatar';
import { User, UserRole, Department } from '../../types';
import { getDepartmentLabel, getRoleLabel } from '../../utils/formatters';
import { SellerProfileModal } from './SellerProfileModal';

export const TeamList: React.FC = () => {
  const { users, addUser, currentUser } = useApp();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [department, setDepartment] = useState<Department>('sales');
  const [phone, setPhone] = useState('+57 300 123 4567');
  const [pinCode, setPinCode] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!/^\d{4}$/.test(pinCode)) return;

    setSavingUser(true);
    try {
      await addUser({
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@stonerscolombia.com`,
        role,
        department,
        avatar: '',
        phone,
        documentNumber,
        birthDate,
        city,
        address,
        hireDate,
        pinCode
      });

      setName('');
      setEmail('');
      setPinCode('');
      setDocumentNumber('');
      setBirthDate('');
      setCity('');
      setAddress('');
      setHireDate('');
      setShowAddUserModal(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo registrar el colaborador.');
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestión de Equipo y Niveles de Acceso (RBAC)</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {users.length} Integrantes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Directorio de personal, roles, PINs de autenticación e indicadores individuales</p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Colaborador</span>
          </button>
        )}
      </div>

      {/* Role Access Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: 'admin', title: 'Administrador', desc: 'Acceso total, gestión del equipo, indicadores y exportación' },
          { role: 'vendedor', title: 'Vendedor', desc: 'Registro de ventas, seguimiento de metas y tareas asignadas' },
          { role: 'contador', title: 'Contador', desc: 'Gestión de tareas y procedimientos del área contable' }
        ].map((r) => (
          <div key={r.role} className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{r.title}</span>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-snug">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Users Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div 
            key={u.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm dark:shadow-lg space-y-4"
          >
            <div className="flex items-start gap-3">
              <UserAvatar name={u.name} role={u.role} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{u.name}</h3>
                  {u.id === currentUser.id && (
                    <span className="rounded bg-emerald-50 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                      TÚ
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{getRoleLabel(u.role)}</p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">{getDepartmentLabel(u.department)}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-1 text-xs text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-[11px]">
                <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500" />
                  <span>{u.phone || '+57 300 000 0000'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="h-3 w-3" />
                  <span>PIN protegido</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-neutral-900">
              <span className="text-slate-500 dark:text-neutral-400">Eficiencia Score:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{u.productivityScore} pts</span>
            </div>

            {u.role === 'vendedor' && (
              <button
                onClick={() => setSelectedSeller(u)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-emerald-500"
              >
                <TrendingUp className="h-4 w-4" />
                Ver ficha comercial
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Registrar Nuevo Colaborador</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Andrés Felipe Correa"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="andres.correa@stonerscolombia.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Rol Operativo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="contador">Contador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Departamento</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="sales">Ventas</option>
                    <option value="admin">Administrador</option>
                    <option value="accounting">Contabilidad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Documento</label>
                  <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Fecha de nacimiento</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Ciudad</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Fecha de ingreso</label>
                  <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Dirección</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">PIN Acceso (4 dígitos)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    required
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 px-4 py-2 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {savingUser ? 'Guardando…' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSeller && (
        <SellerProfileModal seller={users.find(user => user.id === selectedSeller.id) || selectedSeller} onClose={() => setSelectedSeller(null)} />
      )}

    </div>
  );
};
