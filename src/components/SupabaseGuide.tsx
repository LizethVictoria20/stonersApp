import React, { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, Database, ExternalLink, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface HealthResponse {
  status: 'ok' | 'degraded';
  database: { provider: string; connected: boolean; error?: string };
}

export const SupabaseGuide: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setError('');
    try {
      setHealth(await apiRequest<HealthResponse>('/api/health'));
    } catch (connectionError) {
      setHealth(null);
      setError(connectionError instanceof Error ? connectionError.message : 'No fue posible conectar con Express.');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => { void testConnection(); }, []);
  const connected = health?.database.connected === true;

  return (
    <div className="max-w-5xl space-y-6 text-slate-800 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-neutral-800">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Arquitectura de producción</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">GitHub Pages → Express en Render → Supabase/PostgreSQL</p>
        </div>
        <button type="button" onClick={testConnection} disabled={testing} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-emerald-400">
          <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} /> Verificar conexión
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Cloud, label: 'FRONTEND', title: 'GitHub Pages', text: 'Publica React/Vite y solo conoce la URL pública de la API.' },
          { icon: Server, label: 'API', title: 'Express en Render', text: 'Centraliza validaciones, secretos, persistencia y sincronización.' },
          { icon: Database, label: 'DATOS', title: 'Supabase PostgreSQL', text: 'Guarda los datos verificados de forma persistente y privada.' },
        ].map(({ icon: Icon, label, title, text }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">{label}<Icon className="h-4 w-4" /></div>
            <h3 className="mt-3 text-sm font-extrabold">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-neutral-400">{text}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border p-5 ${connected ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'}`}>
        <div className="flex items-start gap-3">
          {connected ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
          <div>
            <h3 className="text-sm font-extrabold">{connected ? 'PostgreSQL conectado' : 'Configuración pendiente'}</h3>
            <p className="mt-1 text-xs leading-relaxed">{connected ? 'Express confirmó la conexión privada con Supabase.' : error || health?.database.error || 'Configura SUPABASE_URL y SUPABASE_SECRET_KEY en Render.'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="text-sm font-extrabold">Activación</h3>
        <ol className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
          <li><strong>1.</strong> Ejecuta <code>supabase/schema.sql</code> en el SQL Editor de Supabase.</li>
          <li><strong>2.</strong> En Render agrega los secretos <code>SUPABASE_URL</code> y <code>SUPABASE_SECRET_KEY</code>.</li>
          <li><strong>3.</strong> En Render agrega <code>FIREBASE_API_KEY</code>; <code>SESSION_SECRET</code> se genera automáticamente.</li>
          <li><strong>4.</strong> En GitHub conserva únicamente <code>VITE_API_URL</code> apuntando a Render.</li>
          <li><strong>5.</strong> Redespliega Render y luego GitHub Pages.</li>
        </ol>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400">Abrir Supabase <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      <p className="text-[11px] text-slate-500">La clave service_role nunca se expone en el navegador, en variables VITE_* ni en GitHub Pages.</p>
    </div>
  );
};
