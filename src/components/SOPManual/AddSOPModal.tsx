import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen, AlertOctagon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Department, UserRole, SOPStep } from '../../types';

interface AddSOPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSOPModal: React.FC<AddSOPModalProps> = ({ isOpen, onClose }) => {
  const { addSOP } = useApp();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [department, setDepartment] = useState<Department>('sales');
  const [minRoleRequired, setMinRoleRequired] = useState<UserRole>('vendedor');
  const [category, setCategory] = useState('Bioseguridad');
  const [stepsInput, setStepsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const steps: SOPStep[] = stepsInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((s, idx) => ({
        stepNumber: idx + 1,
        title: s,
        description: s,
        isCritical: s.toLowerCase().includes('crític') || s.toLowerCase().includes('segurid') || idx === 0
      }));

    addSOP({
      title: title.trim(),
      summary: summary.trim(),
      department,
      minRoleRequired,
      version: '1.0',
      category,
      steps
    });

    onClose();
  };

  const handleAIGenerateSOP = () => {
    setTitle('Protocolo de cierre y conciliación diaria de caja');
    setSummary('Procedimiento para verificar ventas, medios de pago, soportes y diferencias antes del cierre diario.');
    setDepartment('accounting');
    setCategory('Contabilidad');
    setStepsInput('Consolidar ventas por medio de pago\nComparar el total del sistema con los soportes\nRegistrar y justificar cualquier diferencia\nEnviar el cierre aprobado a Contabilidad');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-teal-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Publicar Nuevo Manual SOP</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Defina normas estandarizadas para el personal operativo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAIGenerateSOP}
              className="flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Sugerir con IA</span>
            </button>
            <button 
              onClick={onClose} 
              className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Título del Procedimiento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Protocolo de Sanitización con BHO"
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Departamento</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="sales">Ventas</option>
                <option value="admin">Administrador</option>
                <option value="accounting">Contabilidad</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Rol Mínimo Exigido</label>
              <select
                value={minRoleRequired}
                onChange={(e) => setMinRoleRequired(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="contador">Contador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Resumen del Objetivo</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Breve descripción de la finalidad de este manual..."
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">
              Pasos del Procedimiento (Un paso por línea)
            </label>
            <textarea
              rows={4}
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              placeholder="Paso 1: Lavado de manos con jabón antibacterial&#10;Paso 2: Colocación de cofia y guantes&#10;Paso 3: Verificación de sensores"
              className="w-full rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:border-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 px-4 py-2 font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white hover:bg-teal-500 transition-all shadow-md cursor-pointer"
            >
              Publicar Manual SOP
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
