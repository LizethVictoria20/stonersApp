import React, { useState } from 'react';
import { X, Mail, RefreshCw, ExternalLink, Inbox, CheckCircle2, Shield, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal: () => void;
}

export const GmailInboxModal: React.FC<GmailInboxModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginModal
}) => {
  const { 
    googleUser, 
    googleAccessToken, 
    gmailMessages, 
    refreshGmailMessages, 
    isFetchingGmail 
  } = useApp();

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col transition-colors duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Bandeja Operativa de Gmail</h2>
                {googleUser && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Sincronizado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {googleUser ? `Conectado a ${googleUser.email}` : 'Inicia sesión con Google para ver tus correos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleUser && (
              <button
                type="button"
                onClick={refreshGmailMessages}
                disabled={isFetchingGmail}
                className="p-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer"
                title="Actualizar correos"
              >
                <RefreshCw className={`h-4 w-4 ${isFetchingGmail ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-neutral-800 p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!googleUser ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-center space-y-4 my-auto">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 flex items-center justify-center text-slate-400">
                <Mail className="h-6 w-6 text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Acceso con Gmail no conectado</h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-md mx-auto">
                  Inicia sesión con tu cuenta de Google para consultar comunicados operativos, pedidos y notificaciones de correo directamente desde este panel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLoginModal();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 transition-all shadow-md cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                <span>Iniciar Sesión con Google</span>
              </button>
            </div>
          ) : gmailMessages.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/40 text-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-400 dark:text-neutral-500 mx-auto" />
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                {isFetchingGmail ? 'Cargando correos recientes desde Gmail...' : 'No se encontraron correos recientes o la bandeja está al día.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gmailMessages.map((msg) => {
                const isSelected = selectedMessageId === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessageId(isSelected ? null : msg.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-slate-900 dark:text-white ring-1 ring-emerald-500/30' 
                        : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                            {msg.subject || '(Sin Asunto)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          De: <span className="text-slate-700 dark:text-neutral-300 font-medium">{msg.from}</span>
                        </p>
                      </div>
                      {msg.date && (
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono shrink-0">
                          {msg.date.split(' ').slice(0, 4).join(' ')}
                        </span>
                      )}
                    </div>

                    <p className={`mt-2 text-xs text-slate-600 dark:text-neutral-300 font-normal leading-relaxed ${isSelected ? '' : 'line-clamp-2'}`}>
                      {msg.snippet}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500 shrink-0">
          <span>Integración directa con Google Gmail API (Modo Lectura)</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-500 font-bold">Stoners Colombia</span>
        </div>

      </div>
    </div>
  );
};
