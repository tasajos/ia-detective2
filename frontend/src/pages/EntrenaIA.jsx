import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ejemplosClasificador } from '../data/contenido.js';

// Una mini "red neuronal" simplificada (solo para demo visual)
// Usa distancia euclidiana al centroide de cada clase
function entrenar(perros, gatos) {
  const promediar = (lista) => {
    if (lista.length === 0) return null;
    const claves = Object.keys(lista[0].caracteristicas);
    const prom = {};
    claves.forEach(k => {
      prom[k] = lista.reduce((s, e) => s + e.caracteristicas[k], 0) / lista.length;
    });
    return prom;
  };
  return {
    centroidePerro: promediar(perros),
    centroideGato: promediar(gatos),
    cantidadPerros: perros.length,
    cantidadGatos: gatos.length,
  };
}

function predecir(modelo, caracteristicas) {
  if (!modelo.centroidePerro || !modelo.centroideGato) {
    return { clase: 'desconocido', confianza: 0 };
  }
  const dist = (a, b) => {
    return Math.sqrt(
      Object.keys(a).reduce((s, k) => s + Math.pow((a[k] - b[k]), 2), 0)
    );
  };
  const dPerro = dist(caracteristicas, modelo.centroidePerro);
  const dGato = dist(caracteristicas, modelo.centroideGato);
  const total = dPerro + dGato;
  if (total === 0) return { clase: 'perro', confianza: 50 };
  const confianzaPerro = (1 - dPerro / total) * 100;
  return {
    clase: dPerro < dGato ? 'perro' : 'gato',
    confianza: Math.round(dPerro < dGato ? confianzaPerro : 100 - confianzaPerro),
  };
}

export default function EntrenaIA() {
  const [entrenadosPerro, setEntrenadosPerro] = useState([]);
  const [entrenadosGato, setEntrenadosGato] = useState([]);
  const [pruebaActual, setPruebaActual] = useState(0);
  const [predicciones, setPredicciones] = useState({});
  const [mostrarRed, setMostrarRed] = useState(false);

  const modelo = entrenar(entrenadosPerro, entrenadosGato);
  const yaEntrenado = entrenadosPerro.length >= 2 && entrenadosGato.length >= 2;

  const agregar = (tipo, ejemplo) => {
    if (tipo === 'perro') {
      if (entrenadosPerro.find(e => e.id === ejemplo.id)) return;
      setEntrenadosPerro(prev => [...prev, ejemplo]);
    } else {
      if (entrenadosGato.find(e => e.id === ejemplo.id)) return;
      setEntrenadosGato(prev => [...prev, ejemplo]);
    }
    setMostrarRed(true);
    setTimeout(() => setMostrarRed(false), 1500);
  };

  const probar = (caso) => {
    if (!yaEntrenado) return;
    const pred = predecir(modelo, caso.caracteristicas);
    setPredicciones(prev => ({ ...prev, [caso.id]: pred }));
  };

  const reiniciar = () => {
    setEntrenadosPerro([]);
    setEntrenadosGato([]);
    setPredicciones({});
  };

  return (
    <div className="px-4 py-6 sm:py-12 max-w-5xl mx-auto">
      {/* Titulo */}
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-neon-cyan mb-2">MÓDULO 02</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3">
          Entrena tu <span className="text-neon-cyan">IA</span>
        </h1>
        <p className="text-bone/70 max-w-2xl">
          Toca los ejemplos para "enseñarle" a la IA qué es un perro y qué es un gato.
          Cuantos más ejemplos uses, mejor aprende. Después prueba si puede adivinar casos nuevos.
        </p>
      </div>

      {/* Banco de ejemplos para entrenar */}
      <div className="card-brutal p-5 sm:p-6 mb-6" style={{ boxShadow: '6px 6px 0 #00f0ff' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">📦 Banco de ejemplos</h2>
          <span className="font-mono text-[10px] text-bone/50">TOCA PARA ENTRENAR</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Perros disponibles */}
          <div>
            <div className="font-mono text-xs text-neon-lime mb-2">🐕 PERROS</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {ejemplosClasificador.perro.map(e => {
                const usado = entrenadosPerro.find(x => x.id === e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => agregar('perro', e)}
                    disabled={usado}
                    className={`aspect-square text-2xl sm:text-3xl border-2 transition-all min-h-[44px] ${
                      usado
                        ? 'border-neon-lime bg-neon-lime/20 opacity-50'
                        : 'border-bone/30 hover:border-neon-lime hover:scale-110'
                    }`}
                  >
                    {e.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gatos disponibles */}
          <div>
            <div className="font-mono text-xs text-neon-magenta mb-2">🐈 GATOS</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {ejemplosClasificador.gato.map(e => {
                const usado = entrenadosGato.find(x => x.id === e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => agregar('gato', e)}
                    disabled={usado}
                    className={`aspect-square text-2xl sm:text-3xl border-2 transition-all min-h-[44px] ${
                      usado
                        ? 'border-neon-magenta bg-neon-magenta/20 opacity-50'
                        : 'border-bone/30 hover:border-neon-magenta hover:scale-110'
                    }`}
                  >
                    {e.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Visualizacion de la "red neuronal" */}
      <div className="card-brutal p-5 sm:p-6 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">🧠 Cerebro de la IA</h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs">
              <span className="text-neon-lime">{entrenadosPerro.length}</span>
              <span className="text-bone/40"> perros · </span>
              <span className="text-neon-magenta">{entrenadosGato.length}</span>
              <span className="text-bone/40"> gatos</span>
            </span>
            {(entrenadosPerro.length > 0 || entrenadosGato.length > 0) && (
              <button
                onClick={reiniciar}
                className="font-mono text-xs text-bone/50 hover:text-neon-orange"
              >
                ↻ Reset
              </button>
            )}
          </div>
        </div>

        {/* Diagrama SVG de la red */}
        <div className="relative">
          <svg viewBox="0 0 600 220" className="w-full h-auto">
            {/* Capa de entrada */}
            <g>
              {[
                { y: 30, label: 'Ladra', color: '#00f0ff' },
                { y: 80, label: 'Ronronea', color: '#ff2dcc' },
                { y: 130, label: 'Tamaño', color: '#d4ff3a' },
                { y: 180, label: 'Lealtad', color: '#ff5722' },
              ].map((n, i) => (
                <g key={i}>
                  <circle cx="80" cy={n.y} r="14" fill={n.color} opacity="0.3" />
                  <circle cx="80" cy={n.y} r="10" fill={n.color} className={mostrarRed ? 'animate-pulse' : ''} />
                  <text x="40" y={n.y + 4} fill="#f5f1e8aa" fontSize="11" textAnchor="end" fontFamily="JetBrains Mono">{n.label}</text>
                </g>
              ))}
            </g>

            {/* Capa oculta */}
            <g>
              {[60, 110, 160].map((y, i) => (
                <circle key={i} cx="300" cy={y} r="14" fill="#f5f1e8" opacity={yaEntrenado ? 0.8 : 0.2} className={mostrarRed && yaEntrenado ? 'animate-pulse' : ''} />
              ))}
            </g>

            {/* Conexiones entrada -> oculta */}
            {[30, 80, 130, 180].map((y1) =>
              [60, 110, 160].map((y2, j) => (
                <line
                  key={`${y1}-${y2}`}
                  x1="80" y1={y1} x2="300" y2={y2}
                  stroke="#f5f1e8"
                  strokeOpacity={yaEntrenado ? 0.25 : 0.08}
                  strokeWidth="1"
                />
              ))
            )}

            {/* Capa salida */}
            <g>
              <circle cx="520" cy="80" r="20" fill="#d4ff3a" opacity={yaEntrenado ? 1 : 0.3} />
              <text x="520" y="84" fill="#0a0a0f" fontSize="20" textAnchor="middle">🐕</text>
              <circle cx="520" cy="140" r="20" fill="#ff2dcc" opacity={yaEntrenado ? 1 : 0.3} />
              <text x="520" y="144" fill="#0a0a0f" fontSize="20" textAnchor="middle">🐈</text>
            </g>

            {/* Conexiones oculta -> salida */}
            {[60, 110, 160].map((y1) =>
              [80, 140].map((y2, j) => (
                <line
                  key={`${y1}-out-${y2}`}
                  x1="300" y1={y1} x2="520" y2={y2}
                  stroke="#f5f1e8"
                  strokeOpacity={yaEntrenado ? 0.3 : 0.08}
                  strokeWidth="1"
                />
              ))
            )}

            <text x="300" y="210" fill="#f5f1e8aa" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">CAPA OCULTA · PESOS APRENDIDOS</text>
          </svg>

          {!yaEntrenado && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-ink/90 border-2 border-bone/30 px-4 py-2 font-mono text-xs">
                ⚠️ Necesita al menos 2 perros y 2 gatos
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pruebas */}
      <div className="card-brutal p-5 sm:p-6" style={{ boxShadow: '6px 6px 0 #ff2dcc' }}>
        <h2 className="font-display text-xl font-bold mb-2">🎯 Pon a prueba la IA</h2>
        <p className="text-bone/60 text-sm mb-4">
          Toca cada animal misterioso. La IA dirá si cree que es perro o gato y con cuánta confianza.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ejemplosClasificador.pruebas.map(p => {
            const pred = predicciones[p.id];
            const acerto = pred && pred.clase === p.real;
            return (
              <button
                key={p.id}
                onClick={() => probar(p)}
                disabled={!yaEntrenado}
                className="card-brutal p-4 text-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bone/5 transition-colors"
                style={{ boxShadow: '4px 4px 0 #f5f1e8' }}
              >
                <div className="text-5xl mb-2">{p.emoji}</div>
                <AnimatePresence>
                  {pred && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs"
                    >
                      <div className={`font-bold ${pred.clase === 'perro' ? 'text-neon-lime' : 'text-neon-magenta'}`}>
                        {pred.clase === 'perro' ? '🐕 PERRO' : '🐈 GATO'}
                      </div>
                      <div className="font-mono text-[10px] text-bone/60">{pred.confianza}% seguro</div>
                      <div className="font-mono text-[10px] mt-1">
                        {acerto ? '✅ Acertó' : '❌ Falló'}
                      </div>
                    </motion.div>
                  )}
                  {!pred && yaEntrenado && (
                    <div className="font-mono text-[10px] text-bone/40">TOCA PARA PROBAR</div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {Object.keys(predicciones).length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 border-2 border-neon-cyan/30 bg-neon-cyan/5"
          >
            <div className="font-mono text-xs text-neon-cyan mb-2">💡 ¿VES LO QUE PASÓ?</div>
            <p className="text-sm text-bone/80 leading-relaxed">
              La IA <strong>no sabe nada del mundo</strong>. Solo aprendió patrones a partir de tus ejemplos.
              Si le mostraste pocos ejemplos, se confunde fácilmente. <strong className="text-neon-lime">Esto es exactamente cómo aprende ChatGPT, Instagram o YouTube</strong>:
              con muchísimos datos. Si los datos están mal, la IA aprende mal.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
