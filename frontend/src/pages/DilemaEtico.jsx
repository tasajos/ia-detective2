import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dilemasEticos } from '../data/contenido.js';

const colorMap = {
  cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan', border: 'border-neon-cyan' },
  magenta: { text: 'text-neon-magenta', bg: 'bg-neon-magenta', border: 'border-neon-magenta' },
  lime: { text: 'text-neon-lime', bg: 'bg-neon-lime', border: 'border-neon-lime' },
  orange: { text: 'text-neon-orange', bg: 'bg-neon-orange', border: 'border-neon-orange' },
};

export default function DilemaEtico() {
  const [indice, setIndice] = useState(0);
  const [voto, setVoto] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [terminado, setTerminado] = useState(false);
  const [nombre] = useState(localStorage.getItem('nombre') || '');

  const dilema = dilemasEticos[indice];
  const c = colorMap[dilema.color];

  // Polling de resultados cada 2 segundos cuando ya votó
  useEffect(() => {
    if (!voto) return;
    const fetchResultados = () => {
      fetch(`/api/dilema/resultados/${dilema.id}`)
        .then(r => r.json())
        .then(setResultados)
        .catch(() => {});
    };
    fetchResultados();
    const id = setInterval(fetchResultados, 2000);
    return () => clearInterval(id);
  }, [voto, dilema.id]);

  const votar = async (opcion) => {
    if (voto) return;
    setVoto(opcion);
    try {
      const res = await fetch('/api/dilema/votar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemaId: dilema.id, voto: opcion, nombreEstudiante: nombre }),
      });
      const data = await res.json();
      setResultados(data);
    } catch (e) {
      console.error(e);
    }
  };

  const siguiente = () => {
    if (indice < dilemasEticos.length - 1) {
      setIndice(i => i + 1);
      setVoto(null);
      setResultados(null);
    } else {
      setTerminado(true);
    }
  };

  if (terminado) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-brutal p-8 max-w-lg w-full text-center"
        >
          <div className="text-7xl mb-4">⚖️</div>
          <h2 className="font-display text-3xl font-bold mb-4">¡Reflexión completa!</h2>
          <p className="text-bone/80 mb-8 leading-relaxed">
            No hay respuestas correctas. La IA va a estar en cada decisión grande de tu generación:
            educación, justicia, salud, trabajo. <span className="text-neon-lime font-bold">Quien la diseñe, decide cómo será el futuro.</span>
            Por eso necesitamos jóvenes pensando en esto desde ya.
          </p>
          <a href="/" className="btn-brutal w-full">VOLVER AL MENÚ</a>
        </motion.div>
      </div>
    );
  }

  const totalVotos = resultados ? resultados.si + resultados.no + resultados.depende : 0;
  const porcentaje = (n) => totalVotos === 0 ? 0 : Math.round((n / totalVotos) * 100);

  return (
    <div className="px-4 py-6 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2 font-mono text-xs">
        <span className="text-bone/60">DILEMA {indice + 1} / {dilemasEticos.length}</span>
        <span className={c.text}>⚖️ EN DEBATE</span>
      </div>

      <div className="h-1 bg-bone/10 mb-8 overflow-hidden">
        <motion.div
          className={`h-full ${c.bg}`}
          animate={{ width: `${(indice / dilemasEticos.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dilema.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className={`card-brutal p-6 sm:p-8 mb-6`}
          style={{ boxShadow: `8px 8px 0 ${
            dilema.color === 'cyan' ? '#00f0ff' :
            dilema.color === 'magenta' ? '#ff2dcc' :
            dilema.color === 'lime' ? '#d4ff3a' : '#ff5722'
          }` }}
        >
          <div className="text-6xl mb-4">{dilema.icono}</div>
          <div className={`font-mono text-[10px] tracking-widest ${c.text} mb-2`}>{dilema.titulo.toUpperCase()}</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 leading-tight">
            {dilema.pregunta}
          </h2>
          <div className="border-l-4 border-bone/30 pl-4 py-1 text-bone/60 text-sm italic">
            {dilema.contexto}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botones de voto */}
      {!voto && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'si', label: 'SÍ', emoji: '✅', color: 'lime' },
            { id: 'depende', label: 'DEPENDE', emoji: '🤔', color: 'cyan' },
            { id: 'no', label: 'NO', emoji: '❌', color: 'magenta' },
          ].map(op => (
            <motion.button
              key={op.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => votar(op.id)}
              className={`card-brutal py-5 text-center hover:bg-bone/5 transition-colors`}
              style={{ boxShadow: `4px 4px 0 ${
                op.color === 'lime' ? '#d4ff3a' :
                op.color === 'cyan' ? '#00f0ff' : '#ff2dcc'
              }` }}
            >
              <div className="text-3xl mb-1">{op.emoji}</div>
              <div className={`font-display font-bold text-${op.color === 'cyan' ? 'neon-cyan' : op.color === 'lime' ? 'neon-lime' : 'neon-magenta'}`}>
                {op.label}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Resultados */}
      {voto && resultados && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <span className="live-dot" /> Resultados en vivo
            </h3>
            <span className="font-mono text-xs text-bone/60">{totalVotos} voto(s)</span>
          </div>

          {[
            { id: 'si', label: 'SÍ', emoji: '✅', n: resultados.si, color: 'lime' },
            { id: 'depende', label: 'DEPENDE', emoji: '🤔', n: resultados.depende, color: 'cyan' },
            { id: 'no', label: 'NO', emoji: '❌', n: resultados.no, color: 'magenta' },
          ].map(op => {
            const pct = porcentaje(op.n);
            const isMyVote = voto === op.id;
            return (
              <div key={op.id} className={`relative p-4 border-2 ${isMyVote ? 'border-bone' : 'border-bone/20'}`}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{op.emoji}</span>
                    <span className="font-display font-bold">{op.label}</span>
                    {isMyVote && (
                      <span className="font-mono text-[10px] text-neon-lime border border-neon-lime px-1.5 py-0.5">
                        TU VOTO
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-sm">
                    <span className="font-bold">{pct}%</span>
                    <span className="text-bone/40 ml-2">({op.n})</span>
                  </div>
                </div>
                {/* Barra de fondo animada */}
                <motion.div
                  className={`absolute top-0 left-0 h-full ${
                    op.color === 'lime' ? 'bg-neon-lime/20' :
                    op.color === 'cyan' ? 'bg-neon-cyan/20' : 'bg-neon-magenta/20'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            );
          })}

          <button
            onClick={siguiente}
            className="btn-brutal w-full mt-4"
          >
            {indice < dilemasEticos.length - 1 ? 'SIGUIENTE DILEMA →' : 'VER REFLEXIÓN FINAL'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
