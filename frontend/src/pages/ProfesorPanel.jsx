import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function ProfesorPanel() {
  const [ranking, setRanking] = useState({ ranking: [], totalEstudiantes: 0, totalRespuestas: 0 });
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.origin);
    const fetchData = () => {
      fetch('/api/ranking')
        .then(r => r.json())
        .then(setRanking)
        .catch(() => {});
    };
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  const reiniciar = async () => {
    if (!confirm('¿Reiniciar toda la sesión? Se perderán los votos y el ranking.')) return;
    await fetch('/api/reset', { method: 'POST' });
    setRanking({ ranking: [], totalEstudiantes: 0, totalRespuestas: 0 });
  };

  return (
    <div className="px-4 py-6 sm:py-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-neon-cyan mb-2">PANEL DEL PROFESOR</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold">
          Modo <span className="text-neon-cyan">presentación</span>
        </h1>
        <p className="text-bone/60 mt-2">Proyecta esta pantalla para que los estudiantes se conecten.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR para conectarse */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-brutal p-6 sm:p-8 text-center"
          style={{ boxShadow: '8px 8px 0 #00f0ff' }}
        >
          <h2 className="font-display text-2xl font-bold mb-2">📱 Únete desde tu celular</h2>
          <p className="text-bone/60 text-sm mb-6">Escanea el QR o entra a la URL</p>

          <div className="bg-bone p-4 inline-block mb-4">
            <QRCodeSVG value={url} size={220} bgColor="#f5f1e8" fgColor="#0a0a0f" />
          </div>

          <div className="font-mono text-lg break-all bg-ink border-2 border-neon-cyan p-3 text-neon-cyan">
            {url}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="font-display text-4xl text-neon-lime">{ranking.totalEstudiantes}</div>
              <div className="font-mono text-[10px] text-bone/50 uppercase">Estudiantes</div>
            </div>
            <div>
              <div className="font-display text-4xl text-neon-magenta">{ranking.totalRespuestas}</div>
              <div className="font-mono text-[10px] text-bone/50 uppercase">Respuestas</div>
            </div>
          </div>
        </motion.div>

        {/* Ranking en vivo */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-brutal p-6 sm:p-8"
          style={{ boxShadow: '8px 8px 0 #d4ff3a' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              🏆 Ranking
            </h2>
            <span className="font-mono text-xs flex items-center gap-1 text-neon-lime">
              <span className="live-dot" /> EN VIVO
            </span>
          </div>

          {ranking.ranking.length === 0 ? (
            <div className="text-center py-12 text-bone/40">
              <div className="text-5xl mb-3">⏳</div>
              <p className="font-mono text-xs">Esperando que los estudiantes jueguen…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ranking.ranking.map((est, i) => {
                const medallas = ['🥇', '🥈', '🥉'];
                return (
                  <motion.div
                    key={est.nombre}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 p-3 ${
                      i === 0 ? 'bg-neon-lime/10 border-2 border-neon-lime' :
                      i < 3 ? 'border-2 border-bone/20' :
                      'border border-bone/10'
                    }`}
                  >
                    <div className="font-display text-2xl w-10 text-center">
                      {medallas[i] || `#${i + 1}`}
                    </div>
                    <div className="flex-1 font-bold truncate">{est.nombre}</div>
                    <div className="font-mono text-neon-lime font-bold">{est.puntos} pts</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Boton de reset */}
      <div className="mt-8 text-center">
        <button
          onClick={reiniciar}
          className="font-mono text-xs text-bone/40 hover:text-neon-orange border border-bone/20 hover:border-neon-orange px-4 py-2 transition-colors"
        >
          ↻ REINICIAR SESIÓN
        </button>
      </div>
    </div>
  );
}
