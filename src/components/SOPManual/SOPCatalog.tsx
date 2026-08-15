import React, { useState } from 'react';
import { BookOpen, Plus, Search, ShieldCheck, CheckCircle2, AlertCircle, FileText, Sparkles, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SOPProcedure } from '../../types';
import { getDepartmentLabel, getRoleLabel } from '../../utils/formatters';

interface SOPCatalogProps {
  onOpenSOPDetail: (sop: SOPProcedure) => void;
  onOpenAddSOP: () => void;
}

export const SOPCatalog: React.FC<SOPCatalogProps> = ({ onOpenSOPDetail, onOpenAddSOP }) => {
  const { sops, searchQuery, selectedDeptFilter, currentUser } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredSOPs = sops.filter(s => {
    const matchesSearch = searchQuery === '' || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDeptFilter === 'all' || s.department === selectedDeptFilter;
    const matchesCat = categoryFilter === 'all' || s.category === categoryFilter;

    return matchesSearch && matchesDept && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manual de Procedimientos y SOPs</h2>
            <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-400 border border-teal-500/30">
              {filteredSOPs.length} Protocolos
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Estándares operativos, firmas de conformidad y normatividad higiénico-sanitaria</p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={onOpenAddSOP}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-teal-950/20 dark:shadow-teal-950/50 hover:from-teal-500 hover:to-emerald-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Manual SOP</span>
          </button>
        )}
      </div>

      {/* Grid of SOP Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSOPs.map((sop) => {
          const isAcknowledged = sop.acknowledgedBy.some(a => a.userId === currentUser.id);
          return (
            <div
              key={sop.id}
              onClick={() => onOpenSOPDetail(sop)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5 shadow-sm dark:shadow-lg hover:border-teal-500/60 dark:hover:border-teal-500/60 hover:shadow-md cursor-pointer transition-all space-y-4"
            >
              {/* Header Badge & Version */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800/60">
                  {sop.code}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:text-neutral-400 dark:bg-neutral-900 px-2 py-0.5 rounded-md">
                  v{sop.version} | {sop.lastUpdated}
                </span>
              </div>

              {/* Title & Summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                  {sop.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {sop.summary}
                </p>
              </div>

              {/* Steps & Role Required */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-900 text-xs">
                <span className="text-slate-500 dark:text-neutral-400 font-medium">
                  {sop.steps.length} Pasos ({sop.steps.filter(s => s.isCritical).length} Críticos)
                </span>
                <span className="rounded bg-slate-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-neutral-300">
                  Rol: {getRoleLabel(sop.minRoleRequired)}
                </span>
              </div>

              {/* User Acknowledgement status badge */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400" />
                  <span className="text-slate-500 dark:text-neutral-400">{sop.acknowledgedBy.length} Firmas</span>
                </div>

                {isAcknowledged ? (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    FIRMADO
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-50 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                    PENDIENTE FIRMA
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
