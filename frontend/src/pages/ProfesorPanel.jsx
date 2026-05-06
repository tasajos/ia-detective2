import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

// ============================================
// Helpers para formatear los eventos en estilo terminal
// ============================================
const horaCorta = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const truncar = (texto, n) => {
  if (!texto) return '';
  return texto.length > n ? texto.substring(0, n) + '…' : texto;
};

// Estiliza un evento como linea de terminal
const colorEvento = {
  pregunta: 'text-neon-cyan',
  respuesta_ia: 'text-neon-lime',
  juego_respuesta: 'text-neon-magenta',
  voto_dilema: 'text-neon-orange',
};

const prefijoEvento = {
  pregunta: '[QUERY ]',
  respuesta_ia: '[AI-OUT]',
  juego_respuesta: '[GAME  ]',
  voto_dilema: '[VOTE  ]',
};

// ============================================
// Componente principal
// ============================================
export default function ProfesorPanel() {
  const [pestania, setPestania] = useState('inicio'); // 'inicio' | 'terminal' | 'ranking'
  const [ranking, setRanking] = useState({ ranking: [], totalEstudiantes: 0, totalRespuestas: 0 });
  const [actividad, setActividad] = useState({ eventos: [], estudiantesActivos: [], totales: {} });
  const [url, setUrl] = useState('');
  const [eventosVistos, setEventosVistos] = useState(new Set());
  const [animandoEventos, setAnimandoEventos] = useState([]);
  const terminalRef = useRef(null);

  // Cargar la URL una sola vez
  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  // Polling de ranking + actividad
  useEffect(() => {
    const fetchTodo = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch('/api/ranking').then(r => r.json()),
          fetch('/api/actividad-vivo').then(r => r.json()),
        ]);
        setRanking(r1);

        // Detectar eventos NUEVOS para animarlos
        setActividad(prevActividad => {
          const idsAnteriores = new Set(prevActividad.eventos.map(e => e.id));
          const nuevos = r2.eventos.filter(e => !idsAnteriores.has(e.id));
          if (nuevos.length > 0 && prevActividad.eventos.length > 0) {
            setAnimandoEventos(nuevos.map(e => e.id));
            setTimeout(() => setAnimandoEventos([]), 2000);
          }
          return r2;
        });
      } catch (e) {
        // silencio: el polling sigue
      }
    };
    fetchTodo();
    const id = setInterval(fetchTodo, 2000);
    return () => clearInterval(id);
  }, []);

  const reiniciar = async () => {
    if (!confirm('¿Reiniciar toda la sesión? Se perderán los votos, mensajes y el ranking.')) return;
    await fetch('/api/reset', { method: 'POST' });
    setRanking({ ranking: [], totalEstudiantes: 0, totalRespuestas: 0 });
    setActividad({ eventos: [], estudiantesActivos: [], totales: {} });
  };

  return (
    <div className="px-4 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <img
              src="/unicen-logo.jpg"
              alt="UNICEN"
              className="w-14 h-14 object-contain bg-bone p-1"
            />
            <div>
              <div className="font-mono text-[10px] tracking-widest text-neon-cyan mb-1">
                UNICEN · PANEL DEL PROFESOR · MODO PRESENTACIÓN
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">
                Sala de <span className="text-neon-cyan">control</span>
              </h1>
            </div>
          </div>
          <div className="font-mono text-xs flex items-center gap-3 flex-wrap">
            <span className="text-bone/60">
              <span className="text-neon-lime font-bold">{ranking.totalEstudiantes}</span> conectados
            </span>
            <span className="text-bone/60">
              <span className="text-neon-magenta font-bold">{actividad.eventos.length}</span> eventos
            </span>
            <button
              onClick={reiniciar}
              className="text-bone/40 hover:text-neon-orange border border-bone/20 hover:border-neon-orange px-2 py-1 transition-colors"
            >
              ↻ RESET
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-6 border-b-2 border-bone/10 overflow-x-auto">
        {[
          { id: 'inicio', label: '📱 Conectar', color: 'cyan' },
          { id: 'terminal', label: '⚡ Terminal en vivo', color: 'lime' },
          { id: 'red', label: '🌐 Red de búsquedas', color: 'magenta' },
          { id: 'ranking', label: '🏆 Ranking', color: 'orange' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPestania(p.id)}
            className={`px-4 py-2 font-mono text-xs whitespace-nowrap transition-all border-b-2 ${
              pestania === p.id
                ? `border-neon-${p.color} text-neon-${p.color} bg-neon-${p.color}/5`
                : 'border-transparent text-bone/60 hover:text-bone'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Contenido segun pestaña */}
      <AnimatePresence mode="wait">
        {pestania === 'inicio' && (
          <motion.div
            key="inicio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PestaniaInicio url={url} actividad={actividad} ranking={ranking} />
          </motion.div>
        )}

        {pestania === 'terminal' && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PestaniaTerminal
              actividad={actividad}
              animandoEventos={animandoEventos}
              terminalRef={terminalRef}
            />
          </motion.div>
        )}

        {pestania === 'red' && (
          <motion.div
            key="red"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PestaniaRedBusquedas />
          </motion.div>
        )}

        {pestania === 'ranking' && (
          <motion.div
            key="ranking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PestaniaRanking ranking={ranking} actividad={actividad} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// PESTAÑA 1: Conectar (QR + estadisticas)
// ============================================
function PestaniaInicio({ url, actividad, ranking }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR */}
      <div className="card-brutal p-6 sm:p-8 text-center" style={{ boxShadow: '8px 8px 0 #00f0ff' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/unicen-logo.jpg" alt="UNICEN" className="w-10 h-10 object-contain bg-bone p-0.5" />
          <div className="text-left">
            <div className="font-display text-base font-bold leading-none">UNICEN</div>
            <div className="font-mono text-[9px] text-bone/50 leading-none mt-0.5">
              IA DETECTIVE · 2026
            </div>
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">📱 Únete desde tu celular</h2>
        <p className="text-bone/60 text-sm mb-6">Escanea el QR o entra a la URL</p>

        <div className="bg-bone p-4 inline-block mb-4">
          <QRCodeSVG value={url} size={220} bgColor="#f5f1e8" fgColor="#0a0a0f" />
        </div>

        <div className="font-mono text-base sm:text-lg break-all bg-ink border-2 border-neon-cyan p-3 text-neon-cyan">
          {url}
        </div>
      </div>

      {/* Stats grandes */}
      <div className="space-y-4">
        <div className="card-brutal p-6" style={{ boxShadow: '6px 6px 0 #d4ff3a' }}>
          <div className="font-mono text-[10px] text-bone/50 uppercase tracking-widest mb-1">
            Estudiantes conectados
          </div>
          <div className="font-display text-6xl text-neon-lime font-bold">
            {ranking.totalEstudiantes}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {actividad.estudiantesActivos.slice(0, 12).map(n => (
              <span key={n} className="font-mono text-[10px] bg-neon-lime/10 text-neon-lime border border-neon-lime/30 px-1.5 py-0.5">
                {n}
              </span>
            ))}
            {actividad.estudiantesActivos.length > 12 && (
              <span className="font-mono text-[10px] text-bone/40">
                +{actividad.estudiantesActivos.length - 12} más
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card-brutal p-4" style={{ boxShadow: '4px 4px 0 #ff2dcc' }}>
            <div className="font-mono text-[10px] text-bone/50 uppercase tracking-widest mb-1">
              Preguntas a IA
            </div>
            <div className="font-display text-3xl text-neon-magenta font-bold">
              {actividad.totales?.preguntas || 0}
            </div>
          </div>
          <div className="card-brutal p-4" style={{ boxShadow: '4px 4px 0 #00f0ff' }}>
            <div className="font-mono text-[10px] text-bone/50 uppercase tracking-widest mb-1">
              Respuestas IA
            </div>
            <div className="font-display text-3xl text-neon-cyan font-bold">
              {actividad.totales?.respuestasIA || 0}
            </div>
          </div>
          <div className="card-brutal p-4" style={{ boxShadow: '4px 4px 0 #d4ff3a' }}>
            <div className="font-mono text-[10px] text-bone/50 uppercase tracking-widest mb-1">
              Juego ¿Humano o IA?
            </div>
            <div className="font-display text-3xl text-neon-lime font-bold">
              {actividad.totales?.votosJuego || 0}
            </div>
          </div>
          <div className="card-brutal p-4" style={{ boxShadow: '4px 4px 0 #ff5722' }}>
            <div className="font-mono text-[10px] text-bone/50 uppercase tracking-widest mb-1">
              Votos éticos
            </div>
            <div className="font-display text-3xl text-neon-orange font-bold">
              {actividad.totales?.votosDilemas || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PESTAÑA 2: Terminal estilo Matrix
// ============================================
function PestaniaTerminal({ actividad, animandoEventos, terminalRef }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Terminal grande (izquierda) */}
      <div className="xl:col-span-2">
        <div className="bg-black border-2 border-neon-lime overflow-hidden">
          {/* Barra superior tipo terminal */}
          <div className="bg-neon-lime/10 border-b border-neon-lime/30 px-3 py-1.5 flex items-center gap-2 font-mono text-[11px]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-neon-lime" />
            </div>
            <span className="text-neon-lime ml-2">ia-detective@san-agustin: ~/sesion-en-vivo</span>
            <span className="ml-auto text-bone/40 hidden sm:inline">
              <span className="live-dot" /> stream activo
            </span>
          </div>

          {/* Contenido de la terminal */}
          <div
            ref={terminalRef}
            className="p-3 sm:p-4 font-mono text-xs leading-relaxed text-neon-lime min-h-[500px] max-h-[600px] overflow-y-auto"
          >
            {/* Header animado */}
            <div className="mb-3 text-bone/60">
              <div>$ ia-detective --modo=presentacion --colegio=san-agustin</div>
              <div className="text-neon-lime">
                ✓ Sistema iniciado · Streaming de eventos en tiempo real · {new Date().toLocaleString('es-BO')}
              </div>
              <div className="text-bone/40">
                ─────────────────────────────────────────────────────
              </div>
            </div>

            {/* Lista de eventos */}
            {actividad.eventos.length === 0 ? (
              <div className="text-bone/40">
                <span className="text-neon-cyan">[INFO ]</span> Esperando actividad de los estudiantes
                <CursorParpadeando />
              </div>
            ) : (
              <div className="space-y-1">
                {actividad.eventos.map(ev => (
                  <LineaTerminal
                    key={ev.id}
                    evento={ev}
                    nuevo={animandoEventos.includes(ev.id)}
                  />
                ))}
              </div>
            )}

            {/* Cursor al final */}
            <div className="mt-3 flex items-center gap-2 text-bone/60">
              <span className="text-neon-lime">$</span>
              <span className="text-bone/40">esperando próximo evento</span>
              <CursorParpadeando />
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-bone/60">
          <span><span className="text-neon-cyan">[QUERY]</span> = pregunta del estudiante</span>
          <span><span className="text-neon-lime">[AI-OUT]</span> = respuesta de la IA</span>
          <span><span className="text-neon-magenta">[GAME]</span> = juego ¿Humano o IA?</span>
          <span><span className="text-neon-orange">[VOTE]</span> = voto en dilema</span>
        </div>
      </div>

      {/* Panel derecho con métricas y procesamiento */}
      <div className="space-y-4">
        <PanelProcesamiento actividad={actividad} />
        <PanelEstudiantes activos={actividad.estudiantesActivos} />
      </div>
    </div>
  );
}

// Linea individual de la terminal
function LineaTerminal({ evento, nuevo }) {
  const [expandido, setExpandido] = useState(false);
  const color = colorEvento[evento.tipo] || 'text-bone';
  const prefijo = prefijoEvento[evento.tipo] || '[?]';
  const horaStr = horaCorta(evento.timestamp);

  const tieneDetalles =
    (evento.queries && evento.queries.length > 0) ||
    (evento.fuentes && evento.fuentes.length > 0) ||
    (evento.contenido && evento.contenido.length > 120);

  return (
    <motion.div
      layout
      initial={nuevo ? { opacity: 0, x: -10, backgroundColor: '#d4ff3a33' } : false}
      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
      transition={{ duration: 0.4 }}
      className="hover:bg-bone/5 px-1 py-0.5"
    >
      {/* Linea principal */}
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-bone/40 shrink-0">{horaStr}</span>
        <span className={`${color} shrink-0`}>{prefijo}</span>
        <span className="text-bone/80 shrink-0">{evento.estudiante}</span>
        <span className="text-bone/40 shrink-0">→</span>
        <span className="text-bone/90 break-words flex-1 min-w-0">
          {expandido ? evento.contenido : truncar(evento.contenido, 120)}
        </span>
        {evento.tokens && (
          <span className="text-bone/40 shrink-0">[{evento.tokens} tk]</span>
        )}
        {evento.busquedasWeb > 0 && (
          <span className="bg-neon-cyan/20 text-neon-cyan px-1.5 py-0 text-[10px] shrink-0">
            🌐 {evento.busquedasWeb}
          </span>
        )}
        {tieneDetalles && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="text-bone/50 hover:text-neon-lime text-[10px] shrink-0 px-1"
          >
            {expandido ? '▼ ocultar' : '▶ detalles'}
          </button>
        )}
      </div>

      {/* Detalles expandidos: queries y fuentes */}
      {expandido && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="ml-12 mt-2 mb-3 pl-3 border-l-2 border-neon-cyan/40 space-y-2"
        >
          {evento.queries && evento.queries.length > 0 && (
            <div>
              <div className="text-neon-cyan text-[10px] mb-1">
                ┌─ QUERIES ENVIADAS A GOOGLE ({evento.queries.length})
              </div>
              {evento.queries.map((q, i) => (
                <div key={i} className="text-bone/70 text-[11px] ml-3">
                  │  <span className="text-neon-lime">{i + 1}.</span> "{q}"
                </div>
              ))}
            </div>
          )}

          {evento.fuentes && evento.fuentes.length > 0 && (
            <div>
              <div className="text-neon-magenta text-[10px] mb-1">
                ┌─ FUENTES CONSULTADAS ({evento.fuentes.length})
              </div>
              {evento.fuentes.map((f, i) => (
                <div key={i} className="text-[11px] ml-3 break-all">
                  │  <span className="text-neon-magenta">▸</span>{' '}
                  <span className="text-neon-cyan">{f.dominio}</span>
                  <span className="text-bone/40"> · {truncar(f.titulo, 60)}</span>
                </div>
              ))}
              <div className="text-bone/30 text-[10px] mt-1">└──────</div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Cursor que parpadea
function CursorParpadeando() {
  return <span className="inline-block w-2 h-4 bg-neon-lime ml-1 animate-pulse" />;
}

// Panel de "procesamiento" (simula que la IA esta pensando)
function PanelProcesamiento({ actividad }) {
  const [estados, setEstados] = useState([]);

  // Cuando hay una pregunta sin respuesta cercana, mostrar "procesando"
  useEffect(() => {
    const proceso = [
      { etapa: 'Analizando intención del usuario', emoji: '🔍' },
      { etapa: 'Consultando base de conocimiento', emoji: '📚' },
      { etapa: 'Generando tokens de respuesta', emoji: '⚡' },
      { etapa: 'Aplicando filtros de seguridad', emoji: '🛡️' },
      { etapa: 'Formateando respuesta final', emoji: '✨' },
    ];

    const id = setInterval(() => {
      setEstados(prev => {
        const ultimo = prev[prev.length - 1];
        const siguiente = proceso[(ultimo?.idx + 1 || 0) % proceso.length];
        const nuevo = {
          ...siguiente,
          idx: (ultimo?.idx + 1) || 0,
          tiempo: new Date().toLocaleTimeString('es-BO').split(':').slice(1).join(':'),
          ms: Math.floor(Math.random() * 300 + 50),
        };
        const nuevos = [...prev, nuevo].slice(-5);
        return nuevos;
      });
    }, 1500);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-black border-2 border-neon-cyan p-3">
      <div className="flex items-center justify-between mb-3 font-mono text-[10px]">
        <span className="text-neon-cyan">▣ MOTOR DE IA</span>
        <span className="text-bone/40 flex items-center gap-1">
          <span className="live-dot" /> ACTIVO
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px] min-h-[150px]">
        {estados.length === 0 ? (
          <div className="text-bone/40">Inicializando…</div>
        ) : (
          estados.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 ${i === estados.length - 1 ? 'text-neon-cyan' : 'text-bone/50'}`}
            >
              <span>{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="break-words">{e.etapa}</div>
                <div className="text-[9px] text-bone/30">
                  {e.tiempo} · {e.ms}ms
                </div>
              </div>
              {i === estados.length - 1 && (
                <span className="text-neon-lime">●</span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Barra de "procesamiento" */}
      <div className="mt-3 pt-3 border-t border-neon-cyan/20">
        <div className="flex items-center justify-between font-mono text-[9px] text-bone/50 mb-1">
          <span>RECOLECTANDO RESPUESTAS</span>
          <span className="text-neon-lime">{actividad.totales?.preguntas || 0} qry</span>
        </div>
        <div className="h-1.5 bg-bone/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-magenta"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: '50%' }}
          />
        </div>
      </div>
    </div>
  );
}

// Panel de estudiantes activos
function PanelEstudiantes({ activos }) {
  return (
    <div className="bg-black border-2 border-neon-magenta p-3">
      <div className="flex items-center justify-between mb-3 font-mono text-[10px]">
        <span className="text-neon-magenta">▣ NODOS ACTIVOS</span>
        <span className="text-bone/40">{activos.length} online</span>
      </div>
      <div className="space-y-1 font-mono text-[11px] max-h-[200px] overflow-y-auto">
        {activos.length === 0 ? (
          <div className="text-bone/40">— sin nodos conectados —</div>
        ) : (
          activos.map((nombre, i) => (
            <div key={nombre} className="flex items-center gap-2">
              <span className="text-neon-lime text-[8px]">●</span>
              <span className="text-bone/80 truncate flex-1">{nombre}</span>
              <span className="text-bone/30 text-[9px]">#{String(i + 1).padStart(3, '0')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// PESTAÑA 3: Ranking
// ============================================
function PestaniaRanking({ ranking, actividad }) {
  return (
    <div className="card-brutal p-6 sm:p-8" style={{ boxShadow: '8px 8px 0 #d4ff3a' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          🏆 Top del salón
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
                <div className="font-display text-2xl w-12 text-center">
                  {medallas[i] || `#${i + 1}`}
                </div>
                <div className="flex-1">
                  <div className="font-bold truncate">{est.nombre}</div>
                  <div className="font-mono text-[10px] text-bone/50">
                    {est.aciertos} aciertos · {est.totalRespuestas} respuestas
                  </div>
                </div>
                <div className="font-mono text-neon-lime font-bold text-xl">
                  {est.puntos}
                  <span className="text-[10px] text-bone/40 ml-1">pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// PESTAÑA 4: Red de búsquedas (grafo de nodos)
// Force-directed graph hecho a mano con simulación física
// ============================================
function PestaniaRedBusquedas() {
  const [datos, setDatos] = useState({
    estudiantes: [],
    queries: [],
    fuentes: [],
    conexiones: [],
    totales: {},
  });
  const [seleccionado, setSeleccionado] = useState(null);
  const [destacado, setDestacado] = useState(null); // id que se destaca al hover
  const [vista, setVista] = useState({ x: 0, y: 0, escala: 1 });
  const svgRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(null);
  const [posicionMouse, setPosicionMouse] = useState({ x: 0, y: 0 });

  // Polling de la red cada 3 segundos
  useEffect(() => {
    const fetchRed = async () => {
      try {
        const res = await fetch('/api/red-busquedas');
        const data = await res.json();
        setDatos(data);
      } catch (e) { /* silencio */ }
    };
    fetchRed();
    const id = setInterval(fetchRed, 3000);
    return () => clearInterval(id);
  }, []);

  // Construir nodos con posiciones (simulacion de fuerzas simplificada)
  const nodos = useMemo(() => {
    const W = 1200;
    const H = 700;
    const lista = [];

    // Estudiantes a la izquierda
    datos.estudiantes.forEach((e, i) => {
      const total = Math.max(datos.estudiantes.length, 1);
      const y = (H / (total + 1)) * (i + 1);
      lista.push({
        id: `est_${e.nombre}`,
        tipo: 'estudiante',
        label: e.nombre,
        x: 120,
        y,
        radio: 22 + Math.min(e.totalBusquedas, 6) * 2,
        meta: e,
      });
    });

    // Queries en el centro
    datos.queries.forEach((q, i) => {
      const total = Math.max(datos.queries.length, 1);
      const y = (H / (total + 1)) * (i + 1);
      lista.push({
        id: `q_${q.texto}`,
        tipo: 'query',
        label: q.texto.length > 35 ? q.texto.substring(0, 32) + '…' : q.texto,
        labelCompleto: q.texto,
        x: W / 2,
        y,
        radio: 14 + Math.min(q.count, 5) * 3,
        meta: q,
      });
    });

    // Fuentes a la derecha (ordenadas por count)
    const fuentesOrdenadas = [...datos.fuentes].sort((a, b) => b.count - a.count);
    fuentesOrdenadas.forEach((f, i) => {
      const total = Math.max(fuentesOrdenadas.length, 1);
      const y = (H / (total + 1)) * (i + 1);
      lista.push({
        id: `f_${f.dominio}`,
        tipo: 'fuente',
        label: f.dominio,
        x: W - 120,
        y,
        radio: 18 + Math.min(f.count, 8) * 2.5,
        meta: f,
      });
    });

    return lista;
  }, [datos]);

  const indiceNodo = useMemo(
    () => Object.fromEntries(nodos.map(n => [n.id, n])),
    [nodos]
  );

  // Conexiones unicas (para no dibujar lineas duplicadas)
  const conexionesUnicas = useMemo(() => {
    const set = new Set();
    return datos.conexiones.filter(c => {
      const k = `${c.from}->${c.to}`;
      if (set.has(k)) return false;
      set.add(k);
      return indiceNodo[c.from] && indiceNodo[c.to];
    });
  }, [datos.conexiones, indiceNodo]);

  // Vista vacia
  if (nodos.length === 0) {
    return (
      <div className="card-brutal p-8 text-center" style={{ boxShadow: '6px 6px 0 #ff2dcc' }}>
        <div className="text-6xl mb-4">🌐</div>
        <h2 className="font-display text-2xl font-bold mb-2">Red vacía</h2>
        <p className="text-bone/60">
          Cuando los estudiantes hagan preguntas que requieran búsqueda en internet,
          aparecerán aquí los nodos y sus conexiones.
        </p>
        <div className="mt-6 inline-block font-mono text-[10px] text-bone/40 border border-bone/20 px-3 py-1.5">
          ESPERANDO PRIMERA BÚSQUEDA WEB…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Nodos estudiante" valor={datos.totales.estudiantes} color="lime" />
        <StatCard label="Queries únicas" valor={datos.totales.queries} color="cyan" />
        <StatCard label="Fuentes web" valor={datos.totales.fuentes} color="magenta" />
        <StatCard label="Búsquedas totales" valor={datos.totales.busquedas} color="orange" />
      </div>

      {/* Grafo + panel lateral */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* SVG del grafo */}
        <div className="xl:col-span-3 bg-black border-2 border-neon-magenta relative overflow-hidden">
          <div className="bg-neon-magenta/10 border-b border-neon-magenta/30 px-3 py-1.5 flex items-center gap-2 font-mono text-[11px]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-neon-lime" />
            </div>
            <span className="text-neon-magenta ml-2">grafo-de-busquedas.svg</span>
            <span className="ml-auto text-bone/40 hidden sm:flex items-center gap-1">
              <span className="live-dot" /> renderizando
            </span>
          </div>

          <div className="relative">
            <svg
              ref={svgRef}
              viewBox="0 0 1200 700"
              className="w-full h-auto bg-[#050508]"
              style={{ minHeight: '500px' }}
            >
              {/* Definiciones */}
              <defs>
                <radialGradient id="glow-est">
                  <stop offset="0%" stopColor="#d4ff3a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d4ff3a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-q">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-f">
                  <stop offset="0%" stopColor="#ff2dcc" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ff2dcc" stopOpacity="0" />
                </radialGradient>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f0ff" opacity="0.6" />
                </marker>
                <marker id="arrow-magenta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff2dcc" opacity="0.6" />
                </marker>
              </defs>

              {/* Grilla de fondo */}
              <pattern id="grid-bg" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d4ff3a" strokeOpacity="0.05" strokeWidth="1" />
              </pattern>
              <rect width="1200" height="700" fill="url(#grid-bg)" />

              {/* Etiquetas de columnas */}
              <text x="120" y="30" fill="#d4ff3a99" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono">
                ESTUDIANTES
              </text>
              <text x="600" y="30" fill="#00f0ff99" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono">
                QUERIES → IA
              </text>
              <text x="1080" y="30" fill="#ff2dcc99" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono">
                FUENTES WEB
              </text>

              {/* Conexiones (lineas) */}
              {conexionesUnicas.map((c, i) => {
                const desde = indiceNodo[c.from];
                const hacia = indiceNodo[c.to];
                const isHighlighted =
                  destacado === c.from || destacado === c.to ||
                  seleccionado === c.from || seleccionado === c.to;
                return (
                  <line
                    key={i}
                    x1={desde.x}
                    y1={desde.y}
                    x2={hacia.x}
                    y2={hacia.y}
                    stroke={c.tipo === 'pregunto' ? '#00f0ff' : '#ff2dcc'}
                    strokeOpacity={isHighlighted ? 0.9 : 0.2}
                    strokeWidth={isHighlighted ? 2 : 1}
                    markerEnd={c.tipo === 'pregunto' ? 'url(#arrow-cyan)' : 'url(#arrow-magenta)'}
                  />
                );
              })}

              {/* Nodos */}
              {nodos.map(n => {
                const isHighlighted = destacado === n.id || seleccionado === n.id;
                const colores = {
                  estudiante: { fill: '#d4ff3a', stroke: '#d4ff3a', glow: 'glow-est' },
                  query: { fill: '#00f0ff', stroke: '#00f0ff', glow: 'glow-q' },
                  fuente: { fill: '#ff2dcc', stroke: '#ff2dcc', glow: 'glow-f' },
                };
                const c = colores[n.tipo];
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    onMouseEnter={() => setDestacado(n.id)}
                    onMouseLeave={() => setDestacado(null)}
                    onClick={() => setSeleccionado(seleccionado === n.id ? null : n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow */}
                    {(isHighlighted) && (
                      <circle r={n.radio + 25} fill={`url(#${c.glow})`} opacity="0.6" />
                    )}
                    {/* Pulso animado */}
                    <circle r={n.radio} fill={c.fill} opacity={isHighlighted ? 0.4 : 0.15}>
                      <animate
                        attributeName="r"
                        values={`${n.radio};${n.radio + 4};${n.radio}`}
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Cuerpo del nodo */}
                    <circle
                      r={n.radio - 4}
                      fill="#0a0a0f"
                      stroke={c.stroke}
                      strokeWidth={isHighlighted ? 3 : 2}
                    />
                    {/* Icono / inicial */}
                    <text
                      y="5"
                      textAnchor="middle"
                      fill={c.stroke}
                      fontSize={n.tipo === 'estudiante' ? 12 : 10}
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {n.tipo === 'estudiante' ? '👤' : n.tipo === 'query' ? '🔍' : '🌐'}
                    </text>
                    {/* Etiqueta debajo */}
                    <text
                      y={n.radio + 14}
                      textAnchor="middle"
                      fill="#f5f1e8cc"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      {n.label.length > 25 ? n.label.substring(0, 22) + '…' : n.label}
                    </text>
                    {/* Badge de count para fuentes/queries */}
                    {n.tipo !== 'estudiante' && n.meta.count > 1 && (
                      <g transform={`translate(${n.radio - 2}, ${-n.radio + 2})`}>
                        <circle r="8" fill={c.fill} />
                        <text
                          y="3"
                          textAnchor="middle"
                          fill="#0a0a0f"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                        >
                          {n.meta.count}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Leyenda */}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neon-lime" /> Estudiante
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neon-cyan" /> Query a Google
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neon-magenta" /> Fuente web
              </span>
            </div>
          </div>
        </div>

        {/* Panel lateral con detalles del nodo seleccionado */}
        <div className="bg-black border-2 border-neon-cyan p-4">
          {seleccionado ? (
            <DetalleNodo
              nodo={indiceNodo[seleccionado]}
              onCerrar={() => setSeleccionado(null)}
            />
          ) : (
            <div className="text-center py-6 font-mono text-xs text-bone/40">
              <div className="text-3xl mb-3">👆</div>
              Toca un nodo para ver sus detalles, IP, país, conexiones…
            </div>
          )}

          {/* Mapa de IPs siempre visible */}
          <div className="mt-4 pt-4 border-t border-bone/10">
            <div className="font-mono text-[10px] text-neon-cyan mb-2">
              📡 ORÍGENES DETECTADOS
            </div>
            <div className="space-y-1.5">
              {datos.estudiantes.length === 0 ? (
                <div className="font-mono text-[10px] text-bone/40">
                  — sin datos —
                </div>
              ) : (
                datos.estudiantes.map(e => (
                  <div key={e.nombre} className="font-mono text-[10px] flex items-start gap-2">
                    <span className="text-neon-lime shrink-0">▸</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-bone/80 truncate">{e.nombre}</div>
                      <div className="text-bone/40 text-[9px] truncate">
                        {e.ip} · {e.codigoPais !== '?' ? `${e.pais}` : 'red local'}
                      </div>
                      <div className="text-neon-magenta text-[9px]">
                        {e.ciudad}
                      </div>
                    </div>
                    <span className="text-neon-cyan text-[9px] shrink-0">
                      {e.totalBusquedas}🔍
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, valor, color }) {
  const map = {
    lime: '#d4ff3a',
    cyan: '#00f0ff',
    magenta: '#ff2dcc',
    orange: '#ff5722',
  };
  return (
    <div className="card-brutal p-3" style={{ boxShadow: `4px 4px 0 ${map[color]}` }}>
      <div className="font-mono text-[9px] text-bone/50 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div
        className="font-display text-3xl font-bold"
        style={{ color: map[color] }}
      >
        {valor || 0}
      </div>
    </div>
  );
}

function DetalleNodo({ nodo, onCerrar }) {
  if (!nodo) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-widest text-neon-cyan">
          {nodo.tipo === 'estudiante' ? '👤 NODO ESTUDIANTE' : nodo.tipo === 'query' ? '🔍 NODO QUERY' : '🌐 NODO FUENTE'}
        </span>
        <button
          onClick={onCerrar}
          className="font-mono text-bone/40 hover:text-neon-orange text-xs"
        >
          ✕
        </button>
      </div>

      <div className="font-display text-lg font-bold mb-3 break-words">
        {nodo.labelCompleto || nodo.label}
      </div>

      {/* Detalles segun tipo */}
      {nodo.tipo === 'estudiante' && (
        <div className="space-y-2 font-mono text-[11px]">
          <CampoDetalle label="IP del cliente" valor={nodo.meta.ip} color="lime" />
          <CampoDetalle label="País" valor={nodo.meta.pais} color="cyan" />
          <CampoDetalle label="Ciudad" valor={nodo.meta.ciudad} color="magenta" />
          <CampoDetalle label="Búsquedas hechas" valor={`${nodo.meta.totalBusquedas} 🔍`} color="orange" />
        </div>
      )}

      {nodo.tipo === 'query' && (
        <div className="space-y-2 font-mono text-[11px]">
          <CampoDetalle label="Veces consultada" valor={nodo.meta.count} color="cyan" />
          <CampoDetalle label="Estudiantes que preguntaron" valor={nodo.meta.estudiantes.length} color="lime" />
          <div>
            <div className="text-bone/40 text-[9px] uppercase tracking-widest mb-1">
              Quiénes preguntaron:
            </div>
            <div className="flex flex-wrap gap-1">
              {nodo.meta.estudiantes.map(e => (
                <span key={e} className="bg-neon-lime/10 text-neon-lime px-1.5 py-0.5 text-[10px]">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {nodo.tipo === 'fuente' && (
        <div className="space-y-2 font-mono text-[11px]">
          <CampoDetalle label="Veces consultada" valor={nodo.meta.count} color="magenta" />
          {nodo.meta.titulos && nodo.meta.titulos.length > 0 && (
            <div>
              <div className="text-bone/40 text-[9px] uppercase tracking-widest mb-1">
                Páginas consultadas:
              </div>
              <div className="space-y-1">
                {nodo.meta.titulos.map((t, i) => (
                  <div key={i} className="text-bone/70 text-[10px] break-words">
                    ▸ {t}
                  </div>
                ))}
              </div>
            </div>
          )}
          {nodo.meta.urls && nodo.meta.urls.length > 0 && (
            <a
              href={nodo.meta.urls[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-neon-cyan hover:underline text-[10px] break-all"
            >
              ↗ Abrir primera URL
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CampoDetalle({ label, valor, color }) {
  const map = {
    lime: 'text-neon-lime',
    cyan: 'text-neon-cyan',
    magenta: 'text-neon-magenta',
    orange: 'text-neon-orange',
  };
  return (
    <div>
      <div className="text-bone/40 text-[9px] uppercase tracking-widest">{label}</div>
      <div className={`${map[color]} text-[12px] break-all`}>{valor}</div>
    </div>
  );
}