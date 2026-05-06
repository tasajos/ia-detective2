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
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />

      {/* Background gradient blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-neon-lime/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Header */}
      {!esInicio && (
        <header className="relative z-20 border-b-2 border-bone/10 backdrop-blur-md bg-ink/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:rotate-12 transition-transform">🔍</span>
              <div>
                <div className="font-display font-bold text-sm leading-none">IA DETECTIVE</div>
                <div className="font-mono text-[10px] text-neon-lime leading-none mt-0.5">SAN AGUSTÍN · 2026</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-2 font-mono text-xs text-bone/60">
                <span className="live-dot" />
                EN VIVO · {hora}
              </span>
              <Link
                to="/"
                className="font-mono text-xs px-3 py-1.5 border border-bone/30 hover:border-neon-lime hover:text-neon-lime transition-colors"
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

      {/* Footer (solo en pantallas grandes) */}
      {!esInicio && (
        <footer className="relative z-10 border-t-2 border-bone/10 mt-12 py-4">
          <div className="max-w-6xl mx-auto px-4 font-mono text-[10px] text-bone/40 flex justify-between flex-wrap gap-2">
            <span>IA DETECTIVE / V1.0 · COCHABAMBA, BO</span>
            <span>POWERED BY CLAUDE · REACT · NODE</span>
          </div>
        </footer>
      )}
    </div>
  );
}
