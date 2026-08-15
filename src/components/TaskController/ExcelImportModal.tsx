import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Task, Department, TaskPriority } from '../../types';
import { downloadSampleExcelTemplate } from '../../utils/exportPdfCsv';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { importTasksFromExcel, users, currentUser } = useApp();
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setErrorMsg('El archivo no contiene registros o no se pudo leer.');
          return;
        }

        setParsedRows(data);
      } catch (err: any) {
        setErrorMsg('Error al procesar archivo Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const mapDepartment = (val: string): Department => {
    const lower = (val || '').toLowerCase();
    if (lower.includes('contab') || lower.includes('finanz')) return 'accounting';
    if (lower.includes('admin') || lower.includes('direc')) return 'admin';
    return 'sales';
  };

  const mapPriority = (val: string): TaskPriority => {
    const lower = (val || '').toLowerCase();
    if (lower.includes('urg') || lower.includes('crit')) return 'critical';
    if (lower.includes('alt')) return 'high';
    if (lower.includes('med')) return 'medium';
    return 'low';
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newTasks: Task[] = parsedRows.map((row, idx) => {
      const codeNumber = Math.floor(100 + Math.random() * 900);
      const title = row['Título Tarea'] || row['Titulo'] || row['Tarea'] || `Tarea Importada ${idx + 1}`;
      const description = row['Descripción'] || row['Descripcion'] || 'Importado desde hoja de cálculo.';
      const deptName = row['Departamento'] || row['Area'] || 'sales';
      const prioName = row['Prioridad'] || 'medium';
      const assignedName = row['Nombre Asignado'] || row['Asignado A'] || users[0].name;
      const dueDate = row['Fecha Límite (AAAA-MM-DD)'] || row['Fecha Limite'] || new Date().toISOString().split('T')[0];

      const assignedUser = users.find(u => u.name.toLowerCase().includes(assignedName.toLowerCase())) || users[0];

      return {
        id: `task-excel-${Date.now()}-${idx}`,
        code: `TSK-${codeNumber}`,
        title,
        description,
        department: mapDepartment(deptName),
        priority: mapPriority(prioName),
        status: 'pending',
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
        assignedToAvatar: assignedUser.avatar,
        assignedById: currentUser.id,
        assignedByName: currentUser.name,
        createdDate: new Date().toISOString().split('T')[0],
        dueDate,
        estimatedHours: Number(row['Horas Estimadas']) || 2,
        actualHours: 0,
        subtasks: [],
        notes: []
      };
    });

    importTasksFromExcel(newTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Importar Tareas desde Excel / CSV</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Cargue lotes masivos de tareas para diferentes departamentos</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Download Template Action */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">¿No tienes la plantilla oficial?</p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">Descarga nuestro formato de hoja de cálculo prediseñado.</p>
          </div>
          <button
            onClick={downloadSampleExcelTemplate}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Plantilla Excel</span>
          </button>
        </div>

        {/* File Drop Area */}
        <div className="border-2 border-dashed border-slate-300 dark:border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-neutral-900/30 transition-all">
          <Upload className="mx-auto h-8 w-8 text-slate-400 dark:text-neutral-400" />
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Selecciona tu archivo (.xlsx, .xls, .csv)</p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5">Compatible con Excel, Google Sheets y números en blanco</p>
          </div>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Archivo cargado: {fileName} ({parsedRows.length} registros detectados)</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{errorMsg}</p>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Vista Previa de Registros a Importar</h4>
            <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-bold text-slate-600 dark:text-neutral-400">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Título Tarea</th>
                    <th className="p-2">Departamento</th>
                    <th className="p-2">Prioridad</th>
                    <th className="p-2">Asignado A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 text-slate-800 dark:text-neutral-200">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-slate-400 dark:text-neutral-500">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-900 dark:text-white">{row['Título Tarea'] || row['Titulo'] || 'Sin Título'}</td>
                      <td className="p-2 text-slate-600 dark:text-neutral-400">{row['Departamento'] || 'Ventas'}</td>
                      <td className="p-2">{row['Prioridad'] || 'Media'}</td>
                      <td className="p-2">{row['Nombre Asignado'] || 'Asignación Automática'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 5 && (
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 text-right">+ {parsedRows.length - 5} tareas adicionales en cola</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md cursor-pointer"
          >
            Confirmar Importación ({parsedRows.length})
          </button>
        </div>

      </div>
    </div>
  );
};
