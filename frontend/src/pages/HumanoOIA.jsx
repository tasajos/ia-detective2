import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { preguntasHumanoIA } from '../data/contenido.js';

export default function HumanoOIA() {
  const [nombre, setNombre] = useState(localStorage.getItem('nombre') || '');
  const [empezo, setEmpezo] = useState(false);
  const [indice, setIndice] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [mostrarExpl, setMostrarExpl] = useState(false);
  const [stats, setStats] = useState(null);
  const [terminado, setTerminado] = useState(false);

  const pregunta = preguntasHumanoIA[indice];

  useEffect(() => {
    if (nombre) localStorage.setItem('nombre', nombre);
  }, [nombre]);

  const responder = async (eleccion) => {
    if (respuesta) return;
    const correcto = eleccion === pregunta.autor;
    setRespuesta(eleccion);
    setMostrarExpl(true);
    if (correcto) setPuntos(p => p + 10);

    try {
      const res = await fetch('/api/humano-o-ia/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preguntaId: pregunta.id,
          respuesta: eleccion,
          correcto,
          nombreEstudiante: nombre,
        }),
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const siguiente = () => {
    if (indice < preguntasHumanoIA.length - 1) {
      setIndice(i => i + 1);
      setRespuesta(null);
      setMostrarExpl(false);
      setStats(null);
    } else {
      setTerminado(true);
    }
  };

  // Pantalla de inicio
  if (!empezo) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-brutal p-8 max-w-lg w-full"
        >
          <div className="text-6xl mb-4">🕵️</div>
          <h1 className="font-display text-4xl font-bold mb-4">¿Humano o IA?</h1>
          <p className="text-bone/70 mb-6 leading-relaxed">
            Te voy a mostrar 10 textos. Tienes que adivinar si los escribió una persona real
            o si fueron generados por una IA. Al final verás cuántos acertaste y compararás
            con el resto del salón.
          </p>

          <label className="block font-mono text-[11px] uppercase tracking-wider text-bone/50 mb-2">
            Tu nombre o apodo (opcional)
          </label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Cami_2026"
            maxLength={20}
            className="w-full bg-ink border-2 border-bone/30 focus:border-neon-lime text-bone p-3 mb-6 outline-none font-mono"
          />

          <button
            onClick={() => setEmpezo(true)}
            className="btn-brutal w-full"
          >
            EMPEZAR JUEGO →
          </button>
        </motion.div>
      </div>
    );
  }

  // Pantalla final
  if (terminado) {
    const total = preguntasHumanoIA.length;
    const aciertos = puntos / 10;
    const porcentaje = Math.round((aciertos / total) * 100);
    let mensaje = '';
    let emoji = '';
    if (porcentaje === 100) { mensaje = '¡Imposible! Eres un detective de IA profesional 🏆'; emoji = '🏆'; }
    else if (porcentaje >= 80) { mensaje = '¡Excelente! Tienes un radar afilado para detectar IA'; emoji = '🥇'; }
    else if (porcentaje >= 60) { mensaje = '¡Muy bien! Casi siempre la cazas'; emoji = '🥈'; }
    else if (porcentaje >= 40) { mensaje = 'Vas mejorando. La IA es tramposa…'; emoji = '🥉'; }
    else { mensaje = 'La IA te engañó muchas veces. ¡Eso justamente es lo peligroso!'; emoji = '🤖'; }

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-brutal p-8 max-w-lg w-full text-center"
        >
          <div className="text-7xl mb-4">{emoji}</div>
          <h2 className="font-display text-3xl font-bold mb-2">¡Terminaste!</h2>

          <div className="my-8">
            <div className="font-display text-7xl font-bold text-gradient">{aciertos}/{total}</div>
            <div className="font-mono text-sm text-bone/50 mt-2">{porcentaje}% DE ACIERTOS</div>
          </div>

          <p className="text-lg text-bone/80 mb-8">{mensaje}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setIndice(0);
                setPuntos(0);
                setRespuesta(null);
                setMostrarExpl(false);
                setTerminado(false);
              }}
              className="btn-brutal btn-brutal-cyan"
            >
              JUGAR DE NUEVO
            </button>
            <a
              href="/"
              className="btn-brutal btn-brutal-magenta"
            >
              MENÚ
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Juego en curso
  const correcto = respuesta === pregunta.autor;
  const progreso = ((indice) / preguntasHumanoIA.length) * 100;

  return (
    <div className="px-4 py-6 sm:py-12 max-w-3xl mx-auto">
      {/* Header del juego */}
      <div className="flex items-center justify-between mb-2 font-mono text-xs">
        <span className="text-bone/60">PREGUNTA {indice + 1} / {preguntasHumanoIA.length}</span>
        <span className="text-neon-lime">⚡ {puntos} PTS</span>
      </div>
      <div className="h-1 bg-bone/10 mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-neon-lime"
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Tarjeta de la pregunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pregunta.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="card-brutal p-6 sm:p-8 mb-6"
        >
          <div className="font-mono text-[10px] tracking-widest text-bone/40 mb-3">
            ¿QUIÉN ESCRIBIÓ ESTO?
          </div>
          <div className="text-lg sm:text-2xl leading-relaxed font-display italic relative">
            <span className="text-neon-lime text-4xl absolute -top-2 -left-2">"</span>
            <span className="px-4">{pregunta.contenido}</span>
            <span className="text-neon-lime text-4xl absolute -bottom-6 right-0">"</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botones de respuesta */}
      {!respuesta && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => responder('humano')}
            className="card-brutal p-6 hover:bg-neon-cyan/10 transition-colors group"
          >
            <div className="text-5xl mb-2">👤</div>
            <div className="font-display text-xl font-bold">HUMANO</div>
            <div className="font-mono text-xs text-bone/50 mt-1">Lo escribió una persona</div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => responder('ia')}
            className="card-brutal p-6 hover:bg-neon-magenta/10 transition-colors group"
            style={{ boxShadow: '8px 8px 0 #ff2dcc' }}
          >
            <div className="text-5xl mb-2">🤖</div>
            <div className="font-display text-xl font-bold">IA</div>
            <div className="font-mono text-xs text-bone/50 mt-1">Lo generó una máquina</div>
          </motion.button>
        </div>
      )}

      {/* Resultado */}
      <AnimatePresence>
        {mostrarExpl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 border-2 ${correcto ? 'border-neon-lime bg-neon-lime/5' : 'border-neon-magenta bg-neon-magenta/5'} p-6`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{correcto ? '✅' : '❌'}</span>
              <div>
                <div className={`font-display text-2xl font-bold ${correcto ? 'text-neon-lime' : 'text-neon-magenta'}`}>
                  {correcto ? '¡Correcto!' : '¡Te atrapó!'}
                </div>
                <div className="font-mono text-xs text-bone/60">
                  Era: {pregunta.autor === 'humano' ? '👤 HUMANO' : '🤖 IA'}
                </div>
              </div>
            </div>
            <p className="text-bone/80 text-sm sm:text-base leading-relaxed">
              <span className="font-bold text-neon-lime">¿Por qué?</span> {pregunta.explicacion}
            </p>

            {stats && (
              <div className="mt-4 pt-4 border-t border-bone/10 font-mono text-xs text-bone/60">
                📊 {stats.totalVotos} estudiante(s) ha(n) respondido · {stats.porcentajeAciertos}% acertó
              </div>
            )}

            <button
              onClick={siguiente}
              className="mt-6 btn-brutal w-full"
            >
              {indice < preguntasHumanoIA.length - 1 ? 'SIGUIENTE →' : 'VER RESULTADO FINAL'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
