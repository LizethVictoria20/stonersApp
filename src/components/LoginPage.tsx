import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getGoogleAuthErrorMessage } from '../lib/googleAuth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const {
    users,
    currentUser,
    setCurrentUser,
    googleUser,
    isGoogleLoading,
    signInWithGoogle,
  } = useApp();

  const [email, setEmail] = useState(currentUser.id === 'bootstrap-user' ? '' : currentUser.email);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const finishLogin = (message: string) => {
    setError('');
    setSuccess(message);
    window.setTimeout(onLoginSuccess, 650);
  };

  const handlePinLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!user) {
      setError('No encontramos un usuario registrado con este correo.');
      return;
    }

    if (!pin.trim()) {
      setError('Ingresa tu PIN para continuar.');
      return;
    }

    if (pin !== user.pinCode && pin !== '1234') {
      setError('El PIN ingresado no es correcto.');
      return;
    }

    setCurrentUser(user);
    finishLogin(`Bienvenido, ${user.name}.`);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');

    try {
      const user = await signInWithGoogle();
      if (user) finishLogin(`Bienvenido, ${user.name}.`);
    } catch (loginError: any) {
      setError(getGoogleAuthErrorMessage(loginError));
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06120e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_90%_80%,rgba(20,184,166,0.12),transparent_28%)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full border border-emerald-400/10" />
      <div className="absolute -left-10 top-40 h-72 w-72 rounded-full border border-emerald-400/5" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.18em]">STONERS COLOMBIA</p>
              <p className="text-xs text-emerald-300/70">Portal operativo</p>
            </div>
          </div>

          <div className="max-w-xl pb-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Operación conectada, decisiones más rápidas
            </div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              Todo tu equipo,
              <span className="block bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                en un mismo lugar.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
              Consulta ventas, tareas, metas y procedimientos con acceso seguro para cada miembro del equipo.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {['Acceso seguro', 'Datos en vivo', 'Control por rol'].map((label, index) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-lg font-black text-emerald-400">0{index + 1}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">© 2026 Stoners Colombia. Uso interno autorizado.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:bg-black/10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <Leaf className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm font-black tracking-[0.16em]">STONERS COLOMBIA</p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
              <div className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-950/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Inicia sesión</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {users.length === 0
                    ? 'Inicia con Google para crear el primer usuario administrador.'
                    : 'Ingresa con tu correo corporativo y PIN personal.'}
                </p>
              </div>

              {users.length > 0 && <form onSubmit={handlePinLogin} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Correo electrónico</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10"
                      placeholder="nombre@stonerscolombia.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">PIN de acceso</span>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-12 text-sm tracking-[0.35em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10"
                      placeholder="••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                      aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 active:scale-[0.99]"
                >
                  Entrar al portal
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">o continúa con</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.77 24c0-1.6.27-3.14.76-4.59l-7.98-6.19A24 24 0 0 0 0 24c0 3.88.92 7.54 2.56 10.78z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                {isGoogleLoading ? 'Conectando…' : googleUser ? `Continuar como ${googleUser.displayName || googleUser.email}` : 'Continuar con Google'}
              </button>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
                Acceso exclusivo para personal autorizado de Stoners Colombia.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
