import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import pool, { probarConexion, registrarEstudiante } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ============================================
// Cliente de Claude (la IA real que potencia el chat)
// ============================================
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// MIDDLEWARE: manejo de errores async
// ============================================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', asyncHandler(async (req, res) => {
  const dbOk = await probarConexion();
  const [filasCount] = await pool.query(
    'SELECT COUNT(*) AS total FROM estudiantes'
  );

  res.json({
    ok: true,
    mensaje: '🤖 IA Detective backend activo',
    db: dbOk ? 'conectada' : 'desconectada',
    estudiantesConectados: filasCount[0].total,
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// CHAT CON CLAUDE
// ============================================
app.post('/api/chat', asyncHandler(async (req, res) => {
  const { mensaje, historial = [], nombreEstudiante } = req.body;

  if (!mensaje || mensaje.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el mensaje' });
  }

  // Registrar al estudiante (o actualizar su ultima_actividad)
  const estudianteId = await registrarEstudiante(nombreEstudiante);

  // Guardar el mensaje del usuario en la BD
  await pool.query(
    `INSERT INTO conversaciones_chat
       (estudiante_id, nombre_estudiante, rol, mensaje)
     VALUES (?, ?, 'usuario', ?)`,
    [estudianteId, nombreEstudiante || null, mensaje]
  );

  // Construir el historial para Claude (ultimos 10 mensajes)
  const messages = [
    ...historial.slice(-10).map(m => ({
      role: m.rol === 'usuario' ? 'user' : 'assistant',
      content: m.texto,
    })),
    { role: 'user', content: mensaje },
  ];

  try {
    const respuesta = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      system: `Eres un asistente de IA amigable y educativo, respondiendo a estudiantes de secundaria del Colegio San Agustín en Cochabamba, Bolivia.

REGLAS:
- Responde SIEMPRE en español, con un tono cercano, juvenil pero respetuoso.
- Sé breve: máximo 3-4 frases por respuesta, salvo que pidan algo más extenso.
- Si te preguntan sobre IA, explica con analogías simples (cocina, deportes, redes sociales).
- Si te preguntan algo personal o emocional, responde con empatía pero recuérdales que eres una IA.
- Usa ocasionalmente emojis para hacerlo dinámico, pero sin abusar (1-2 por mensaje).
- Si el tema es inapropiado para un colegio, redirige amablemente hacia la conversación educativa.
- Cuando puedas, deja una pregunta curiosa al final para invitar a seguir conversando.

CONTEXTO: Estás demostrando en VIVO cómo funciona un chatbot de IA durante una charla escolar.`,
      messages,
    });

    const textoRespuesta = respuesta.content[0].text;

    // Guardar la respuesta de la IA
    await pool.query(
      `INSERT INTO conversaciones_chat
         (estudiante_id, nombre_estudiante, rol, mensaje, tokens_entrada, tokens_salida)
       VALUES (?, ?, 'asistente', ?, ?, ?)`,
      [
        estudianteId,
        nombreEstudiante || null,
        textoRespuesta,
        respuesta.usage.input_tokens,
        respuesta.usage.output_tokens,
      ]
    );

    res.json({
      respuesta: textoRespuesta,
      modelo: 'claude-opus-4-5',
      tokens: respuesta.usage,
    });
  } catch (error) {
    console.error('Error llamando a Claude:', error.message);
    res.status(500).json({
      error: 'No pudimos contactar a la IA',
      respuesta: '🤖 Ups, algo salió mal de mi lado. ¿Puedes intentarlo de nuevo en unos segundos?',
    });
  }
}));

// ============================================
// JUEGO 1: ¿HUMANO O IA?
// ============================================
app.post('/api/humano-o-ia/responder', asyncHandler(async (req, res) => {
  const { preguntaId, respuesta, correcto, nombreEstudiante } = req.body;

  if (preguntaId == null || respuesta == null || correcto == null) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const estudianteId = await registrarEstudiante(nombreEstudiante);

  await pool.query(
    `INSERT INTO respuestas_humano_ia
       (estudiante_id, nombre_estudiante, pregunta_id, respuesta, correcto)
     VALUES (?, ?, ?, ?, ?)`,
    [estudianteId, nombreEstudiante || null, preguntaId, respuesta, !!correcto]
  );

  // Estadisticas en vivo de esa pregunta
  const [stats] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN correcto THEN 1 ELSE 0 END) AS aciertos
     FROM respuestas_humano_ia
     WHERE pregunta_id = ?`,
    [preguntaId]
  );

  const total = stats[0].total;
  const aciertos = parseInt(stats[0].aciertos || 0, 10);

  res.json({
    totalVotos: total,
    acertaron: aciertos,
    porcentajeAciertos: total > 0 ? Math.round((aciertos / total) * 100) : 0,
  });
}));

// ============================================
// JUEGO 4: DILEMAS ETICOS
// ============================================
app.post('/api/dilema/votar', asyncHandler(async (req, res) => {
  const { dilemaId, voto, nombreEstudiante } = req.body;

  if (!dilemaId || !['si', 'no', 'depende'].includes(voto)) {
    return res.status(400).json({ error: 'Voto invalido' });
  }

  const estudianteId = await registrarEstudiante(nombreEstudiante);

  // Insertar el voto. Si ya votó (UNIQUE KEY), actualiza el voto.
  try {
    await pool.query(
      `INSERT INTO votos_dilemas
         (estudiante_id, nombre_estudiante, dilema_id, voto)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE voto = VALUES(voto), creado_en = NOW()`,
      [estudianteId, nombreEstudiante || `anon_${Date.now()}`, dilemaId, voto]
    );
  } catch (error) {
    // En caso de no tener nombre, permitimos votos anonimos sin restriccion
    if (!nombreEstudiante) {
      await pool.query(
        `INSERT INTO votos_dilemas
           (estudiante_id, nombre_estudiante, dilema_id, voto)
         VALUES (?, ?, ?, ?)`,
        [null, `anon_${Date.now()}_${Math.random()}`, dilemaId, voto]
      );
    } else {
      throw error;
    }
  }

  // Devolver totales actualizados
  const [filas] = await pool.query(
    `SELECT voto, COUNT(*) AS total
     FROM votos_dilemas
     WHERE dilema_id = ?
     GROUP BY voto`,
    [dilemaId]
  );

  const resultados = { si: 0, no: 0, depende: 0 };
  filas.forEach(f => { resultados[f.voto] = parseInt(f.total, 10); });

  res.json(resultados);
}));

app.get('/api/dilema/resultados/:dilemaId', asyncHandler(async (req, res) => {
  const { dilemaId } = req.params;

  const [filas] = await pool.query(
    `SELECT voto, COUNT(*) AS total
     FROM votos_dilemas
     WHERE dilema_id = ?
     GROUP BY voto`,
    [dilemaId]
  );

  const resultados = { si: 0, no: 0, depende: 0 };
  filas.forEach(f => { resultados[f.voto] = parseInt(f.total, 10); });

  res.json(resultados);
}));

// ============================================
// RANKING (vista de la BD)
// ============================================
app.get('/api/ranking', asyncHandler(async (req, res) => {
  const [ranking] = await pool.query(
    `SELECT nombre, puntos, aciertos, total_respuestas
     FROM vista_ranking
     WHERE puntos > 0
     LIMIT 10`
  );

  const [estCount] = await pool.query(
    'SELECT COUNT(*) AS total FROM estudiantes'
  );

  const [respCount] = await pool.query(
    'SELECT COUNT(*) AS total FROM respuestas_humano_ia'
  );

  res.json({
    ranking: ranking.map(r => ({
      nombre: r.nombre,
      puntos: parseInt(r.puntos || 0, 10),
      aciertos: parseInt(r.aciertos || 0, 10),
      totalRespuestas: parseInt(r.total_respuestas || 0, 10),
    })),
    totalEstudiantes: estCount[0].total,
    totalRespuestas: respCount[0].total,
  });
}));

// ============================================
// RESET (vacia las tablas, para el profesor)
// ============================================
app.post('/api/reset', asyncHandler(async (req, res) => {
  // Orden importante por las foreign keys
  await pool.query('DELETE FROM conversaciones_chat');
  await pool.query('DELETE FROM votos_dilemas');
  await pool.query('DELETE FROM respuestas_humano_ia');
  await pool.query('DELETE FROM estudiantes');

  res.json({ ok: true, mensaje: 'Sesion reiniciada' });
}));

// ============================================
// MIDDLEWARE de errores (siempre al final)
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error en API:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    detalle: err.message,
  });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================
async function iniciar() {
  console.log('');
  console.log('  ╔════════════════════════════════════════╗');
  console.log('  ║   🤖  IA DETECTIVE - BACKEND  🔍       ║');
  console.log('  ║   Cochabamba · San Agustín · 2026      ║');
  console.log('  ╚════════════════════════════════════════╝');
  console.log('');

  const dbOk = await probarConexion();
  if (!dbOk) {
    console.error('  ❌ No pude conectar a MySQL.');
    console.error('  💡 Verifica:');
    console.error('     1. Que MySQL esté corriendo');
    console.error('     2. Las credenciales en .env');
    console.error('     3. Que hayas ejecutado: npm run init-db');
    console.error('');
    process.exit(1);
  }

  console.log('  ✅ MySQL conectado');
  console.log(`  ✅ API key: ${process.env.ANTHROPIC_API_KEY ? 'configurada' : '❌ FALTA'}`);

  app.listen(PORT, () => {
    console.log(`  ✅ Servidor en http://localhost:${PORT}`);
    console.log('');
    console.log('  Endpoints disponibles:');
    console.log(`     GET  /api/health`);
    console.log(`     POST /api/chat`);
    console.log(`     POST /api/humano-o-ia/responder`);
    console.log(`     POST /api/dilema/votar`);
    console.log(`     GET  /api/dilema/resultados/:id`);
    console.log(`     GET  /api/ranking`);
    console.log(`     POST /api/reset`);
    console.log('');
  });
}

iniciar();
