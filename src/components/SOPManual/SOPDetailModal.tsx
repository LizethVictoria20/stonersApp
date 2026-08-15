import React from 'react';
import { X, BookOpen, AlertOctagon, CheckCircle2, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SOPProcedure } from '../../types';
import { getDepartmentLabel, getRoleLabel } from '../../utils/formatters';

interface SOPDetailModalProps {
  sop: SOPProcedure | null;
  onClose: () => void;
}

export const SOPDetailModal: React.FC<SOPDetailModalProps> = ({ sop, onClose }) => {
  const { acknowledgeSOP, currentUser } = useApp();

  if (!sop) return null;

  const isAcknowledged = sop.acknowledgedBy.some(a => a.userId === currentUser.id);

  const handleAcknowledge = () => {
    acknowledgeSOP(sop.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-teal-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                {sop.code}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">Versión {sop.version}</span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{sop.title}</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{getDepartmentLabel(sop.department)}</p>
          </div>

          <button 
            onClick={onClose} 
            className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 text-xs text-slate-700 dark:text-neutral-200 leading-relaxed">
          {sop.summary}
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Pasos del Procedimiento ({sop.steps.length})
          </h4>

          <div className="space-y-2.5">
            {sop.steps.map((st) => (
              <div 
                key={st.stepNumber}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  st.isCritical 
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/20 text-rose-950 dark:text-white' 
                    : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-slate-800 dark:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-[10px]">
                      {st.stepNumber}
                    </span>
                    <span>{st.title}</span>
                  </div>

                  {st.isCritical && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-500/30">
                      <AlertOctagon className="h-3 w-3" />
                      Punto Crítico
                    </span>
                  )}
                </div>

                <p className="pl-7 text-slate-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures List */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Registro de Conformidad y Firmas ({sop.acknowledgedBy.length})
          </h4>

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {sop.acknowledgedBy.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic">Nadie ha firmado este protocolo aún.</p>
            ) : (
              sop.acknowledgedBy.map((ack, idx) => (
                <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold">{ack.userName}</span>
                  <span className="text-[9px] text-slate-500 dark:text-neutral-500">({ack.timestamp})</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">
              Rol Mínimo Requerido: <span className="text-slate-900 dark:text-white font-bold">{getRoleLabel(sop.minRoleRequired)}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {!isAcknowledged ? (
              <button
                onClick={handleAcknowledge}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Marcar como Leído y Entendido</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40">
                <CheckCircle2 className="h-4 w-4" />
                <span>Firmado por {currentUser.name}</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
