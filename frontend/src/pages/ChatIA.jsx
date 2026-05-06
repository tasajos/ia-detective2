import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const sugerenciasIniciales = [
  '¿Cómo funcionas por dentro? 🧠',
  '¿Puedes equivocarte? Dame un ejemplo',
  '¿Qué piensas de los humanos?',
  'Inventa un chiste sobre el colegio',
  '¿Qué carrera me recomendarías?',
];

export default function ChatIA() {
  const [mensajes, setMensajes] = useState([
    {
      rol: 'asistente',
      texto: '¡Hola! 👋 Soy una IA real corriendo en este momento. Pregúntame lo que quieras: sobre IA, sobre la vida, sobre el cole. Estoy aquí para ti.',
    },
  ]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [nombre] = useState(localStorage.getItem('nombre') || '');
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  const enviar = async (textoOverride) => {
    const texto = (textoOverride || entrada).trim();
    if (!texto || cargando) return;

    const nuevoMensaje = { rol: 'usuario', texto };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setEntrada('');
    setCargando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto,
          historial: mensajes,
          nombreEstudiante: nombre,
        }),
      });
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'asistente', texto: data.respuesta }]);
    } catch (e) {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: '🤖 Ups, parece que perdí conexión. Inténtalo de nuevo en unos segundos.',
      }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-bone/10">
        <div className="relative">
          <div className="w-12 h-12 bg-neon-magenta flex items-center justify-center text-2xl">
            🤖
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-neon-lime border-2 border-ink rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="font-display text-lg font-bold">Claude</div>
          <div className="font-mono text-[10px] text-neon-lime flex items-center gap-1">
            <span className="live-dot" /> EN LÍNEA · MODELO REAL
          </div>
        </div>
        <span className="font-mono text-[10px] text-bone/40 hidden sm:block">
          ANTHROPIC · OPUS 4.5
        </span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-2">
        <AnimatePresence>
          {mensajes.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 ${
                  m.rol === 'usuario'
                    ? 'bg-neon-lime text-ink font-medium'
                    : 'bg-[#14141c] border-2 border-bone/20 text-bone'
                }`}
              >
                <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{m.texto}</div>
              </div>
            </motion.div>
          ))}
          {cargando && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#14141c] border-2 border-bone/20 px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neon-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neon-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neon-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={finRef} />
      </div>

      {/* Sugerencias (solo al inicio) */}
      {mensajes.length === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-3 flex flex-wrap gap-2"
        >
          {sugerenciasIniciales.map((s, i) => (
            <button
              key={i}
              onClick={() => enviar(s)}
              className="text-xs sm:text-sm px-3 py-1.5 border border-bone/20 hover:border-neon-cyan hover:text-neon-cyan transition-colors text-bone/70"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); enviar(); }}
        className="flex gap-2 pt-3 border-t-2 border-bone/10"
      >
        <input
          type="text"
          value={entrada}
          onChange={e => setEntrada(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={cargando}
          className="flex-1 bg-ink border-2 border-bone/30 focus:border-neon-magenta px-4 py-3 outline-none text-base disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={cargando || !entrada.trim()}
          className="btn-brutal btn-brutal-magenta disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          ENVIAR
        </button>
      </form>
    </div>
  );
}
