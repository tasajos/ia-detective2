import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const [hora, setHora] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHora(ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    actualizar();
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, []);

  const esInicio = location.pathname === '/';

  return (
    <div className="relative min-h-screen bg-ink text-bone overflow-x-hidden">
      {/* Developer credit strip */}
      <div className="relative z-30 bg-ink border-b border-neon-lime/20">
        <div className="px-4 py-1 text-center">
          <span className="font-mono text-[9px] sm:text-[10px] text-neon-lime/60 tracking-wider">
            Desarrollado por Dr.h.c. Ing. Carlos Andres Azcarraga Esquivel
          </span>
        </div>
      </div>

      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />

      {/* Background gradient blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-neon-lime/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Header */}
      {!esInicio && (
        <header className="relative z-20 border-b-2 border-bone/10 backdrop-blur-md bg-ink/60">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <img
                src="/unicen-logo.jpg"
                alt="UNICEN"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain bg-bone p-0.5 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="font-display font-bold text-xs sm:text-sm leading-none">IA DETECTIVE</div>
                <div className="font-mono text-[9px] sm:text-[10px] text-neon-lime leading-none mt-0.5 truncate">
                  UNICEN · SAN AGUSTÍN · 2026
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="hidden sm:flex items-center gap-2 font-mono text-xs text-bone/60">
                <span className="live-dot" />
                EN VIVO · {hora}
              </span>
              <Link
                to="/"
                className="font-mono text-xs px-2 sm:px-3 py-1.5 border border-bone/30 hover:border-neon-lime hover:text-neon-lime transition-colors whitespace-nowrap"
              >
                ← MENÚ
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Contenido */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      {!esInicio && (
        <footer className="relative z-10 border-t-2 border-bone/10 mt-12 py-4">
          <div className="max-w-6xl mx-auto px-4 font-mono text-[9px] sm:text-[10px] text-bone/40 flex flex-col sm:flex-row justify-between gap-2 items-center text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img src="/unicen-logo.jpg" alt="UNICEN" className="w-5 h-5 object-contain bg-bone p-0.5 shrink-0" />
              <span>UNICEN · COMPROMETIDA CON TU FUTURO LABORAL</span>
            </div>
            <span className="text-bone/30">POWERED BY CLAUDE · REACT · NODE · MYSQL</span>
          </div>
        </footer>
      )}
    </div>
  );
}