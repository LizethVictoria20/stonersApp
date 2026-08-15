import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportTasksToPDF, exportTasksToCSV, downloadSampleExcelTemplate } from '../../utils/exportPdfCsv';

export const ExportEngineView: React.FC = () => {
  const { tasks, kpis, users } = useApp();
  const [reportTitle, setReportTitle] = useState('Informe Mensual de Rendimiento Operativo');

  const handleExportPDF = () => {
    exportTasksToPDF(tasks, kpis, users, reportTitle);
  };

  const handleExportCSV = () => {
    exportTasksToCSV(tasks);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Centro de Exportación e Importación de Datos</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400">Generación de informes ejecutivos PDF, planillas CSV y plantillas Excel masivas</p>
      </div>

      {/* PDF Exporter Card */}
      <div className="rounded-3xl border border-slate-200 bg-white dark:border-emerald-900/50 dark:bg-neutral-950 p-6 shadow-sm dark:shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-900 pb-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Generador de Informes Oficiales en PDF</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Exporta un documento membreteado con KPIs, tabla de tareas y firmas de auditoría</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1">Título Personalizado del Documento</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 px-3.5 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] text-slate-400 dark:text-neutral-400 font-bold uppercase">Tareas Incluidas</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{tasks.length} Tareas</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] text-slate-400 dark:text-neutral-400 font-bold uppercase">KPIs Incluidos</span>
              <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">{kpis.length} Indicadores</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] text-slate-400 dark:text-neutral-400 font-bold uppercase">Formato de Salida</span>
              <p className="text-base font-extrabold text-slate-800 dark:text-white">A4 PDF Impreso</p>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-950/20 dark:shadow-emerald-950/60"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Informe PDF Membreteado</span>
          </button>
        </div>
      </div>

      {/* CSV & Excel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CSV Export */}
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exportación plana CSV</h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Estructura para hojas de cálculo externas</p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 py-2.5 text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV UTF-8 ({tasks.length} filas)</span>
          </button>
        </div>

        {/* Excel Template Download */}
        <div className="rounded-3xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Plantilla Excel Oficial</h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Descargue formato para importación masiva</p>
            </div>
          </div>

          <button
            onClick={downloadSampleExcelTemplate}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 py-2.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:border-teal-500/50 transition-all"
          >
            <Download className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Descargar Plantilla .XLSX</span>
          </button>
        </div>

      </div>

    </div>
  );
};
