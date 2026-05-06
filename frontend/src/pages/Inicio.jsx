import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const modulos = [
  {
    id: 'humano-o-ia',
    numero: '01',
    titulo: '¿Humano o IA?',
    desc: 'Lee 10 textos y adivina cuáles los escribió una persona y cuáles una IA. ¿Puedes notar la diferencia?',
    icono: '🕵️',
    color: 'lime',
    duracion: '~5 min',
  },
  {
    id: 'entrena-ia',
    numero: '02',
    titulo: 'Entrena tu IA',
    desc: 'Enseña a una mini-IA a distinguir entre perros y gatos. Mira cómo "aprende" en tiempo real.',
    icono: '🧠',
    color: 'cyan',
    duracion: '~3 min',
  },
  {
    id: 'chat',
    numero: '03',
    titulo: 'Chatea con IA',
    desc: 'Conversa con una IA real. Pregúntale lo que quieras.',
    icono: '💬',
    color: 'magenta',
    duracion: 'libre',
  },
  {
    id: 'dilema',
    numero: '04',
    titulo: 'Dilemas éticos',
    desc: 'Vota en 5 dilemas reales sobre IA. Mira en vivo qué piensa el resto del salón.',
    icono: '⚖️',
    color: 'orange',
    duracion: '~5 min',
  },
];

const colorMap = {
  lime: { border: 'border-neon-lime', text: 'text-neon-lime', bg: 'bg-neon-lime', shadow: 'shadow-[8px_8px_0_#d4ff3a]', hover: 'hover:shadow-[12px_12px_0_#d4ff3a]' },
  cyan: { border: 'border-neon-cyan', text: 'text-neon-cyan', bg: 'bg-neon-cyan', shadow: 'shadow-[8px_8px_0_#00f0ff]', hover: 'hover:shadow-[12px_12px_0_#00f0ff]' },
  magenta: { border: 'border-neon-magenta', text: 'text-neon-magenta', bg: 'bg-neon-magenta', shadow: 'shadow-[8px_8px_0_#ff2dcc]', hover: 'hover:shadow-[12px_12px_0_#ff2dcc]' },
  orange: { border: 'border-neon-orange', text: 'text-neon-orange', bg: 'bg-neon-orange', shadow: 'shadow-[8px_8px_0_#ff5722]', hover: 'hover:shadow-[12px_12px_0_#ff5722]' },
};

export default function Inicio() {
  const [estudiantes, setEstudiantes] = useState(0);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setEstudiantes(d.estudiantesConectados || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Logo institucional + tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 flex-wrap"
          >
            <div className="flex items-center gap-3 bg-bone p-2 pr-4">
              <img src="/unicen-logo.jpg" alt="UNICEN" className="w-12 h-12 object-contain" />
              <div className="font-display">
                <div className="text-ink font-bold text-sm leading-none">UNICEN</div>
                <div className="font-mono text-[9px] text-ink/70 mt-0.5">FUTURO LABORAL</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-neon-lime border border-neon-lime/40 px-3 py-1.5">
              <span className="live-dot" />
              CHARLA EN VIVO · COLEGIO SAN AGUSTÍN · CBBA
            </div>
          </motion.div>

          {/* Titulo principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="font-display font-bold leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 9rem)' }}
          >
            <span className="block">IA</span>
            <span className="block text-gradient italic">Detective</span>
          </motion.h1>

          {/* Subtitulo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-2xl text-lg sm:text-xl text-bone/70 leading-relaxed"
          >
            Cuatro experiencias para entender qué es, cómo piensa, y dónde están los
            <span className="text-neon-lime font-semibold"> límites </span>
            de la inteligencia artificial.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-md"
          >
            <div>
              <div className="font-display text-3xl sm:text-4xl text-neon-lime">04</div>
              <div className="font-mono text-[10px] text-bone/40 mt-1 uppercase tracking-wider">Módulos</div>
            </div>
            <div>
              <div className="font-display text-3xl sm:text-4xl text-neon-cyan">~15</div>
              <div className="font-mono text-[10px] text-bone/40 mt-1 uppercase tracking-wider">Minutos</div>
            </div>
            <div>
              <div className="font-display text-3xl sm:text-4xl text-neon-magenta">{estudiantes || '∞'}</div>
              <div className="font-mono text-[10px] text-bone/40 mt-1 uppercase tracking-wider">Conectados</div>
            </div>
          </motion.div>
        </div>

        {/* Decoracion lateral */}
        <div className="absolute top-20 right-8 hidden lg:block font-mono text-[10px] text-bone/30 rotate-90 origin-top-right">
          v1.0 / 2026 · BUILT WITH CLAUDE
        </div>
      </section>

      {/* Grilla de modulos */}
      <section className="relative px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-8 border-b border-bone/10 pb-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Elige una <span className="text-neon-lime">misión</span>
            </h2>
            <span className="font-mono text-[10px] text-bone/40 hidden sm:block">/ EXPLORA EN ORDEN O LIBRE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {modulos.map((m, i) => {
              const c = colorMap[m.color];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/${m.id}`}
                    className={`group relative block p-6 sm:p-8 bg-[#14141c] border-2 border-bone ${c.shadow} ${c.hover} hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200`}
                  >
                    {/* Numero gigante de fondo */}
                    <span className="absolute top-2 right-3 font-display text-7xl sm:text-8xl font-bold text-bone/5 leading-none select-none">
                      {m.numero}
                    </span>

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-5xl">{m.icono}</span>
                        <span className={`font-mono text-[10px] ${c.text} border ${c.border} px-2 py-1`}>
                          {m.duracion}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
                        {m.titulo}
                      </h3>

                      <p className="text-bone/60 text-sm sm:text-base leading-relaxed mb-6">
                        {m.desc}
                      </p>

                      <div className={`inline-flex items-center gap-2 font-mono text-xs ${c.text} group-hover:gap-4 transition-all`}>
                        <span>EMPEZAR</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Acceso al panel del profesor */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 pt-8 border-t border-bone/10 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <img src="/unicen-logo.jpg" alt="UNICEN" className="w-12 h-12 object-contain bg-bone p-1" />
              <div className="font-mono text-xs text-bone/40">
                <div>UNIVERSIDAD CENTRAL · UNICEN</div>
                <div className="mt-1">CARRERA DE IA · CHARLA 2026</div>
              </div>
            </div>
            <Link
              to="/profesor"
              className="font-mono text-xs text-bone/50 hover:text-neon-cyan border border-bone/20 hover:border-neon-cyan px-3 py-2 transition-colors"
            >
              👨‍🏫 PANEL PROFESOR
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}