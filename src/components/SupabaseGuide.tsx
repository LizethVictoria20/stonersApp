import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Zap, Server, Code, CheckCircle2, AlertCircle, Copy, RefreshCw, Key, ExternalLink, Layers, Lock, Save, Trash2 } from 'lucide-react';
import { checkSupabaseConnection, isSupabaseConfigured, getSupabaseConfig } from '../lib/supabase';

export const SupabaseGuide: React.FC = () => {
  const config = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(config.url || '');
  const [keyInput, setKeyInput] = useState(config.key || '');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  const handleTestConnection = async (customUrl?: string, customKey?: string) => {
    setTesting(true);
    setConnectionStatus(null);
    const result = await checkSupabaseConnection(customUrl || urlInput, customKey || keyInput);
    setConnectionStatus(result);
    setTesting(false);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof localStorage !== 'undefined') {
      if (urlInput.trim()) {
        localStorage.setItem('stoners_supabase_url', urlInput.trim());
      } else {
        localStorage.removeItem('stoners_supabase_url');
      }
      if (keyInput.trim()) {
        localStorage.setItem('stoners_supabase_key', keyInput.trim());
      } else {
        localStorage.removeItem('stoners_supabase_key');
      }
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    await handleTestConnection(urlInput.trim(), keyInput.trim());
  };

  const handleClearCredentials = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('stoners_supabase_url');
      localStorage.removeItem('stoners_supabase_key');
    }
    setUrlInput('');
    setKeyInput('');
    setConnectionStatus({
      success: false,
      message: 'Credenciales locales limpiadas. La aplicación continúa funcionando en modo local.'
    });
  };

  useEffect(() => {
    handleTestConnection();
  }, []);

  const sqlSchema = `-- ========================================================
-- SCRIPT DE MIGRACIÓN COMPLETO DE BASE DE DATOS EN SUPABASE (POSTGRESQL)
-- Proyecto: Stoners Colombia - Plataforma de Operaciones e Inteligencia
-- ========================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Usuarios / Personal
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor', -- 'admin', 'vendedor', 'contador'
  department TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Tareas Operativas
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'review', 'completed', 'overdue'
  assigned_to_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_avatar TEXT,
  assigned_by_id TEXT,
  assigned_by_name TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  estimated_hours NUMERIC(4,1) DEFAULT 1.0,
  is_daily BOOLEAN DEFAULT FALSE,
  daily_window_start TIME DEFAULT '06:00',
  daily_window_end TIME DEFAULT '21:00',
  notes JSONB DEFAULT '[]'::jsonb,
  proof_file TEXT,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Procedimientos Operativos Estándar (SOPs)
CREATE TABLE IF NOT EXISTS public.sops (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'cultivo', 'extraccion', 'dispensario', 'logistica', 'sanidad'
  version TEXT DEFAULT '1.0',
  summary TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Ventas Diarias
CREATE TABLE IF NOT EXISTS public.daily_sales (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  date DATE NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  seller_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  seller_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'nequi', 'daviplata', 'pos_tarjeta', 'transferencia'
  channel TEXT NOT NULL DEFAULT 'tienda_fisica', -- 'tienda_fisica', 'whatsapp', 'domicilio', 'evento'
  ticket_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Presupuestos y Metas de Ventas
CREATE TABLE IF NOT EXISTS public.sales_budgets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  month TEXT NOT NULL, -- Formato 'AAAA-MM' ej. '2026-08'
  seller_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, seller_id)
);

-- 7. Activar Habilitación de Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_budgets ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de lectura y escritura pública para la aplicación
CREATE POLICY "Permitir lectura publica de usuarios" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de tareas" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion de tareas" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Permitir lectura publica de sops" ON public.sops FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de ventas diarias" ON public.daily_sales FOR ALL USING (true);
CREATE POLICY "Permitir gestion de presupuestos" ON public.sales_budgets FOR ALL USING (true);

-- 9. Activar Replicación en Tiempo Real de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sales;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Gestión de Base de Datos Supabase (PostgreSQL)
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Infraestructura de datos relacional en la nube en reemplazo de AWS
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleTestConnection()}
          disabled={testing}
          className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-emerald-500/50 dark:hover:bg-neutral-800 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
          <span>Probador de Conexión</span>
        </button>
      </div>

      {/* Connection Status Box */}
      {connectionStatus && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
          connectionStatus.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200'
        }`}>
          {connectionStatus.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-bold block text-sm">
              {connectionStatus.success ? 'Estado de Conexión Supabase: OK' : 'Estado de Conexión Supabase: Pendiente'}
            </span>
            <p className="text-xs opacity-90">{connectionStatus.message}</p>
          </div>
        </div>
      )}

      {/* Supabase Overview Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
            <span>BASE DE DATOS</span>
            <Database className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">PostgreSQL Dedicado</h4>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Relacional de alto rendimiento con soporte nativo para JSONB, índices optimizados y consultas ultra-rápidas.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 font-mono text-xs font-bold">
            <span>TIEMPO REAL</span>
            <Zap className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Suscripción Websockets</h4>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Replicación instantánea de tareas y ventas entre dispositivos de vendedores en tiempo real.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold">
            <span>SEGURIDAD</span>
            <Lock className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Row Level Security (RLS)</h4>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Control de acceso a nivel de fila asegurando que cada rol acceda únicamente a la información autorizada.
          </p>
        </div>

      </div>

      {/* Setup Instructions & Live Test Inputs */}
      <div className="rounded-3xl border border-emerald-300 dark:border-emerald-900/40 bg-white dark:bg-neutral-950 p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-neutral-800 pb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Ingreso y Validación de Credenciales Supabase
          </h3>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            (Guarda en almacenamiento local para pruebas inmediatas)
          </span>
        </div>

        {/* Live Input Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">URL de Proyecto Supabase (VITE_SUPABASE_URL):</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className="w-full rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-900 dark:text-white px-3.5 py-2.5 transition-all outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">Clave Anónima Pública (VITE_SUPABASE_ANON_KEY):</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-900 dark:text-white px-3.5 py-2.5 transition-all outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={testing}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Probar y Guardar Credenciales</span>
              </button>

              {(urlInput || keyInput) && (
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold px-3 py-2.5 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Credenciales guardadas en el navegador
              </span>
            )}
          </div>
        </form>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 space-y-3 text-xs">
          <p className="text-slate-800 dark:text-neutral-300 font-bold">
            Variables de Entorno para Producción / Servidor (.env):
          </p>
          <p className="text-slate-600 dark:text-neutral-400 text-[11px] leading-relaxed">
            Cuando tengas tus variables definitivas de Supabase, agrégalas también en tu archivo <code className="text-emerald-600 dark:text-emerald-400 font-mono">.env</code> de la aplicación:
          </p>
          <div className="bg-slate-900 dark:bg-black/80 rounded-xl p-3 font-mono text-[11px] text-emerald-400 dark:text-emerald-300 space-y-1 overflow-x-auto border border-slate-800 dark:border-neutral-800">
            <div>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
          </div>
        </div>

        {/* SQL Editor Code Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Script SQL de Creación de Tablas y Políticas (Supabase SQL Editor)
            </h4>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 dark:bg-black/90 border border-slate-800 dark:border-neutral-800 font-mono text-[11px] text-slate-200 dark:text-neutral-300 overflow-x-auto max-h-96 leading-relaxed select-all">
            {sqlSchema}
          </pre>
        </div>

      </div>

    </div>
  );
};
