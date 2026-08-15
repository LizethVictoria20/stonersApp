import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Task, KPIMetric, Goal, User } from '../types';
import { getDepartmentLabel, getPriorityLabel, getStatusLabel, getRoleLabel } from './formatters';

export function exportTasksToPDF(tasks: Task[], kpis: KPIMetric[], users: User[], titleExtra = 'Informe Operativo de Personal') {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header Banner
  doc.setFillColor(15, 23, 22); // Stoners Obsidian/Emerald dark background
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // Emerald #10b981
  doc.text('STONERS COLOMBIA', 14, 16);

  doc.setFontSize(11);
  doc.setTextColor(229, 231, 235);
  doc.text(`CONTROL OPERATIVO DE PERSONAL - ${titleExtra.toUpperCase()}`, 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Fecha de Generación: ${currentDate} | Generado por Sistema Ops`, 14, 32);

  let startY = 46;

  // KPI Summary Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Resumen de Indicadores Clave (KPIs)', 14, startY);
  startY += 6;

  const kpiData = kpis.map(k => [
    k.title,
    getDepartmentLabel(k.department),
    `${k.currentValue} ${k.unit}`,
    `${k.targetValue} ${k.unit}`,
    k.status === 'on_track' ? 'En Meta' : 'Alerta'
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Indicador KPI', 'Departamento', 'Valor Actual', 'Meta', 'Estado']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  startY = (doc as any).lastAutoTable.finalY + 12;

  // Task Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Detalle de Tareas Operativas y Personal Asignado', 14, startY);
  startY += 6;

  const taskRows = tasks.map(t => [
    t.code,
    t.title,
    getDepartmentLabel(t.department),
    t.assignedToName,
    getPriorityLabel(t.priority),
    getStatusLabel(t.status),
    t.dueDate
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Código', 'Tarea / Procedimiento', 'Departamento', 'Asignado a', 'Prioridad', 'Estado', 'Vencimiento']],
    body: taskRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 22], textColor: [16, 185, 129], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  // Footer Signature Block
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY < 260) {
    doc.setDrawColor(209, 213, 219);
    doc.line(14, finalY + 15, 80, finalY + 15);
    doc.line(130, finalY + 15, 196, finalY + 15);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Firma de Jefe de Operaciones', 14, finalY + 20);
    doc.text('Firma de Auditoría de Calidad', 130, finalY + 20);
  }

  doc.save(`StonersColombia_Reporte_Operativo_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportTasksToCSV(tasks: Task[]) {
  const headers = ['Código', 'Título', 'Descripción', 'Departamento', 'Prioridad', 'Estado', 'Asignado A', 'Creador', 'Fecha Creación', 'Fecha Límite', 'Horas Est.', 'Horas Reales'];
  
  const rows = tasks.map(t => [
    t.code,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    getDepartmentLabel(t.department),
    getPriorityLabel(t.priority),
    getStatusLabel(t.status),
    t.assignedToName,
    t.assignedByName,
    t.createdDate,
    t.dueDate,
    t.estimatedHours,
    t.actualHours
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `StonersColombia_Tareas_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Título Tarea': 'Seguimiento semanal de ventas',
      'Descripción': 'Revisar resultados y oportunidades comerciales de la semana.',
      'Departamento': 'Ventas', // Ventas, Administrador o Contabilidad
      'Prioridad': 'Alta', // Baja, Media, Alta, Urgente
      'Nombre Asignado': 'Nombre del responsable',
      'Fecha Límite (AAAA-MM-DD)': '2026-08-10',
      'Horas Estimadas': 3
    },
    {
      'Título Tarea': 'Conciliación mensual',
      'Descripción': 'Validar ingresos, egresos y soportes del periodo.',
      'Departamento': 'Contabilidad',
      'Prioridad': 'Media',
      'Nombre Asignado': 'Nombre del responsable',
      'Fecha Límite (AAAA-MM-DD)': '2026-08-12',
      'Horas Estimadas': 2
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Tareas');

  XLSX.writeFile(workbook, 'Plantilla_Importacion_Tareas_StonersColombia.xlsx');
}
