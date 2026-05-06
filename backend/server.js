import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import pool, { probarConexion, registrarEstudiante, migrarSiEsNecesario } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Confiamos en el primer proxy (necesario para que req.ip funcione bien en red local)
app.set('trust proxy', true);

// ============================================
// Helper: obtener IP real del cliente
// ============================================
function obtenerIp(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'desconocida';
  // Limpiar formato IPv6 mapeado (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  // ::1 = localhost en IPv6
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

// ============================================
// Helper: geolocalizar una IP (con cache para no martillar la API)
// Usa ip-api.com que es gratis (45 req/min sin key)
// ============================================
const cacheGeo = new Map();

async function geolocalizar(ip) {
  if (!ip || ip === 'desconocida') {
    return { pais: 'Desconocido', ciudad: 'Desconocida', codigoPais: '?' };
  }

  // IPs locales (todos los celulares en la misma WiFi)
  if (
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return { pais: 'Bolivia', ciudad: 'Cochabamba (red local)', codigoPais: 'BO' };
  }

  // Cache para no consultar la misma IP varias veces
  if (cacheGeo.has(ip)) return cacheGeo.get(ip);

  try {
    const respuesta = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,query`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await respuesta.json();
    if (data.status === 'success') {
      const geo = {
        pais: data.country || 'Desconocido',
        ciudad: data.city || 'Desconocida',
        codigoPais: data.countryCode || '?',
      };
      cacheGeo.set(ip, geo);
      return geo;
    }
  } catch (e) {
    // Si falla la geolocalizacion, asumimos local
  }

  const fallback = { pais: 'Desconocido', ciudad: 'Desconocida', codigoPais: '?' };
  cacheGeo.set(ip, fallback);
  return fallback;
}

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

  // Capturar IP y geolocalizar (para mostrar en el mapa de red)
  const ipCliente = obtenerIp(req);
  const geo = await geolocalizar(ipCliente);

  // Registrar al estudiante (o actualizar su ultima_actividad)
  const estudianteId = await registrarEstudiante(nombreEstudiante);

  // Guardar el mensaje del usuario en la BD (con info de red)
  await pool.query(
    `INSERT INTO conversaciones_chat
       (estudiante_id, nombre_estudiante, rol, mensaje, ip_cliente, pais, ciudad)
     VALUES (?, ?, 'usuario', ?, ?, ?, ?)`,
    [estudianteId, nombreEstudiante || null, mensaje, ipCliente, geo.pais, geo.ciudad]
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
      // Modelo: Haiku 4.5 es el mas barato ($1/$5 por millon de tokens)
      // Si quieres mas calidad: 'claude-sonnet-4-6' ($3/$15) o 'claude-opus-4-7' ($5/$25)
      model: 'claude-haiku-4-5',
      max_tokens: 2048, // mas tokens = respuestas mas completas
      // Habilitamos busqueda web para que la IA pueda consultar internet en tiempo real
      // Costo: $10 por cada 1000 busquedas + tokens normales
      // Nota: no usamos user_location porque Bolivia (BO) no esta en la lista soportada,
      // pero la busqueda global funciona perfecto y encuentra resultados locales.
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5, // hasta 5 busquedas por mensaje (mas profundidad)
        },
      ],
      system: `Eres un asistente de IA amigable y educativo, respondiendo a estudiantes de secundaria del Colegio San Agustín en Cochabamba, Bolivia.

REGLAS DE TONO:
- Responde SIEMPRE en español, con un tono cercano, juvenil pero respetuoso.
- Sé COMPLETO en tus respuestas: cuando haya información rica, dáles 5-8 frases bien estructuradas.
- Cuando uses búsqueda web, MUESTRA TODA LA INFORMACIÓN RELEVANTE que encontraste, no solo un resumen mínimo.
- Si te preguntan sobre IA, explica con analogías simples (cocina, deportes, redes sociales).
- Usa emojis con moderación (1-3 por mensaje), nunca en exceso.

REGLAS DE FORMATO:
- Estructura tus respuestas con párrafos cortos para que sea fácil de leer en un celular.
- Si encontraste varios datos, organízalos: cada dato en su propia línea o separados claramente.
- AL FINAL de respuestas con búsqueda web, incluye una sección "📚 Fuentes:" listando los sitios web consultados (solo el dominio, ej: "lostiempos.com, unitel.bo").

USO DE BÚSQUEDA WEB:
- Tienes acceso a internet a través de la herramienta web_search. ÚSALA cuando:
  • Te pregunten por noticias, eventos actuales, o cosas locales de Bolivia/Cochabamba.
  • Te pregunten sobre personas, lugares o hechos específicos que quizás no conozcas.
  • Te pidan información actualizada (precios, partidos, clima, etc.).
  • La pregunta tenga palabras como "actual", "hoy", "reciente", "último", "ahora".
- Cuando hagas búsquedas sobre Bolivia, INCLUYE EXPLÍCITAMENTE términos como "Bolivia", "Cochabamba" o el nombre del lugar en tu query, porque la búsqueda no sabe automáticamente que estás en Bolivia.
  • Ejemplo: en vez de buscar "clima hoy", busca "clima Cochabamba Bolivia hoy".
  • Ejemplo: en vez de buscar "noticias", busca "noticias Bolivia hoy".
- HAZ MÚLTIPLES BÚSQUEDAS si la primera no da resultados completos. Tienes hasta 5 búsquedas por turno.
- NO uses web_search para preguntas conceptuales generales (qué es la IA, cómo funciona algo abstracto).
- Cuando uses la búsqueda, di "🔍 Busqué en internet y encontré que..." al inicio.

CONTEXTO: Estás demostrando en VIVO cómo funciona un chatbot de IA durante una charla escolar.`,
      messages,
    });

    // La respuesta puede tener varios bloques (tool_use, tool_result, text)
    // Tomamos solo los bloques de texto y los concatenamos
    const textoRespuesta = respuesta.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim() || '🤖 No pude generar una respuesta. ¿Puedes reformular tu pregunta?';

    // Detectamos si uso busqueda web (para mostrarlo en el panel del profesor)
    const uso = respuesta.usage || {};
    const busquedasWeb = uso.server_tool_use?.web_search_requests || 0;

    // Extraer las queries que la IA hizo a Google + las fuentes consultadas
    const queriesBusqueda = [];
    const fuentesConsultadas = [];

    respuesta.content.forEach(bloque => {
      // Bloque de uso de herramienta: la query que la IA mando a Google
      if (bloque.type === 'server_tool_use' && bloque.name === 'web_search') {
        queriesBusqueda.push(bloque.input?.query || '(sin query)');
      }
      // Bloque de resultado: las URLs de los sitios encontrados
      if (bloque.type === 'web_search_tool_result' && Array.isArray(bloque.content)) {
        bloque.content.forEach(resultado => {
          if (resultado.type === 'web_search_result' && resultado.url) {
            try {
              const dominio = new URL(resultado.url).hostname.replace(/^www\./, '');
              fuentesConsultadas.push({
                url: resultado.url,
                dominio,
                titulo: resultado.title || dominio,
              });
            } catch (e) {
              // URL invalida, saltamos
            }
          }
        });
      }
    });

    // Guardar la respuesta de la IA
    await pool.query(
      `INSERT INTO conversaciones_chat
         (estudiante_id, nombre_estudiante, rol, mensaje, tokens_entrada, tokens_salida,
          busquedas_web, queries_busqueda, fuentes, ip_cliente, pais, ciudad)
       VALUES (?, ?, 'asistente', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estudianteId,
        nombreEstudiante || null,
        textoRespuesta,
        respuesta.usage.input_tokens,
        respuesta.usage.output_tokens,
        busquedasWeb,
        queriesBusqueda.length > 0 ? JSON.stringify(queriesBusqueda) : null,
        fuentesConsultadas.length > 0 ? JSON.stringify(fuentesConsultadas) : null,
        ipCliente,
        geo.pais,
        geo.ciudad,
      ]
    );

    res.json({
      respuesta: textoRespuesta,
      modelo: 'claude-haiku-4-5',
      tokens: respuesta.usage,
      busquedasWeb,
      uso_internet: busquedasWeb > 0,
      queriesBusqueda,
      fuentesConsultadas,
      red: {
        ip: ipCliente,
        pais: geo.pais,
        ciudad: geo.ciudad,
        codigoPais: geo.codigoPais,
      },
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
// ACTIVIDAD EN VIVO (para el panel del profesor)
// Devuelve los ultimos eventos para mostrar en la "terminal"
// ============================================
app.get('/api/actividad-vivo', asyncHandler(async (req, res) => {
  // Ultimas 30 conversaciones de chat (con queries y fuentes)
  const [chats] = await pool.query(
    `SELECT id, nombre_estudiante, rol, mensaje, tokens_entrada, tokens_salida,
            busquedas_web, queries_busqueda, fuentes, creado_en
     FROM conversaciones_chat
     ORDER BY creado_en DESC
     LIMIT 30`
  );

  // Ultimas 20 respuestas del juego humano vs IA
  const [respuestas] = await pool.query(
    `SELECT id, nombre_estudiante, pregunta_id, respuesta, correcto, creado_en
     FROM respuestas_humano_ia
     ORDER BY creado_en DESC
     LIMIT 20`
  );

  // Ultimos 20 votos de dilemas
  const [votos] = await pool.query(
    `SELECT id, nombre_estudiante, dilema_id, voto, creado_en
     FROM votos_dilemas
     ORDER BY creado_en DESC
     LIMIT 20`
  );

  // Estudiantes recien conectados (ultimos 10 minutos)
  const [conectados] = await pool.query(
    `SELECT nombre, ultima_actividad
     FROM estudiantes
     WHERE ultima_actividad > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
     ORDER BY ultima_actividad DESC`
  );

  // Combinar todo en una linea de tiempo unificada
  const eventos = [];

  chats.forEach(c => {
    // Parsear queries y fuentes (estan guardadas como JSON string)
    let queries = null;
    let fuentes = null;
    try {
      if (c.queries_busqueda) queries = JSON.parse(c.queries_busqueda);
      if (c.fuentes) fuentes = JSON.parse(c.fuentes);
    } catch (e) { /* JSON malformado, ignorar */ }

    eventos.push({
      tipo: c.rol === 'usuario' ? 'pregunta' : 'respuesta_ia',
      timestamp: c.creado_en,
      estudiante: c.nombre_estudiante || 'anonimo',
      contenido: c.mensaje,
      tokens: c.rol === 'asistente' ? (c.tokens_entrada + c.tokens_salida) : null,
      busquedasWeb: c.busquedas_web || 0,
      queries,
      fuentes,
      id: `chat_${c.id}`,
    });
  });

  respuestas.forEach(r => {
    eventos.push({
      tipo: 'juego_respuesta',
      timestamp: r.creado_en,
      estudiante: r.nombre_estudiante || 'anonimo',
      contenido: `Pregunta #${r.pregunta_id} → respondió "${r.respuesta}" → ${r.correcto ? 'ACIERTO' : 'FALLO'}`,
      acerto: !!r.correcto,
      id: `resp_${r.id}`,
    });
  });

  votos.forEach(v => {
    eventos.push({
      tipo: 'voto_dilema',
      timestamp: v.creado_en,
      estudiante: v.nombre_estudiante || 'anonimo',
      contenido: `Dilema ${v.dilema_id} → votó "${v.voto.toUpperCase()}"`,
      id: `voto_${v.id}`,
    });
  });

  // Ordenar por timestamp descendente (mas recientes primero)
  eventos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    eventos: eventos.slice(0, 50),
    estudiantesActivos: conectados.map(c => c.nombre),
    totales: {
      preguntas: chats.filter(c => c.rol === 'usuario').length,
      respuestasIA: chats.filter(c => c.rol === 'asistente').length,
      votosJuego: respuestas.length,
      votosDilemas: votos.length,
    },
  });
}));

// ============================================
// RED DE BUSQUEDAS (para el grafo de nodos)
// Devuelve estudiantes -> queries -> fuentes con metadatos
// ============================================
app.get('/api/red-busquedas', asyncHandler(async (req, res) => {
  // Solo respuestas de IA que usaron busqueda web
  const [filas] = await pool.query(
    `SELECT id, nombre_estudiante, queries_busqueda, fuentes,
            ip_cliente, pais, ciudad, busquedas_web, creado_en
     FROM conversaciones_chat
     WHERE rol = 'asistente' AND busquedas_web > 0
     ORDER BY creado_en DESC
     LIMIT 50`
  );

  const estudiantes = new Map(); // nombre -> { ip, pais, ciudad, totalBusquedas }
  const queries = new Map();      // texto -> { count, estudiantes: Set }
  const fuentes = new Map();      // dominio -> { count, urls: Set, titulos: Set }
  const conexiones = [];          // [{ from, to, tipo }]

  filas.forEach(fila => {
    const nombre = fila.nombre_estudiante || 'anonimo';

    // Estudiante
    if (!estudiantes.has(nombre)) {
      estudiantes.set(nombre, {
        nombre,
        ip: fila.ip_cliente || 'desconocida',
        pais: fila.pais || 'Desconocido',
        ciudad: fila.ciudad || 'Desconocida',
        totalBusquedas: 0,
        ultimaActividad: fila.creado_en,
      });
    }
    estudiantes.get(nombre).totalBusquedas += fila.busquedas_web;

    // Parsear queries y fuentes (estan como JSON)
    let arrQueries = [];
    let arrFuentes = [];
    try {
      if (fila.queries_busqueda) arrQueries = JSON.parse(fila.queries_busqueda);
      if (fila.fuentes) arrFuentes = JSON.parse(fila.fuentes);
    } catch (e) { /* json invalido */ }

    arrQueries.forEach(q => {
      const qLimpia = (q || '').trim();
      if (!qLimpia) return;

      if (!queries.has(qLimpia)) {
        queries.set(qLimpia, { texto: qLimpia, count: 0, estudiantes: new Set() });
      }
      queries.get(qLimpia).count++;
      queries.get(qLimpia).estudiantes.add(nombre);

      // Conexion estudiante -> query
      conexiones.push({ from: `est_${nombre}`, to: `q_${qLimpia}`, tipo: 'pregunto' });
    });

    arrFuentes.forEach(f => {
      const dom = f.dominio || 'desconocido';
      if (!fuentes.has(dom)) {
        fuentes.set(dom, { dominio: dom, count: 0, titulos: new Set(), urls: new Set() });
      }
      fuentes.get(dom).count++;
      if (f.titulo) fuentes.get(dom).titulos.add(f.titulo);
      if (f.url) fuentes.get(dom).urls.add(f.url);

      // Conectar las queries del fila con las fuentes
      arrQueries.forEach(q => {
        const qLimpia = (q || '').trim();
        if (qLimpia) {
          conexiones.push({ from: `q_${qLimpia}`, to: `f_${dom}`, tipo: 'fue_a' });
        }
      });
    });
  });

  // Convertir a arrays serializables
  res.json({
    estudiantes: Array.from(estudiantes.values()),
    queries: Array.from(queries.values()).map(q => ({
      ...q,
      estudiantes: Array.from(q.estudiantes),
    })),
    fuentes: Array.from(fuentes.values()).map(f => ({
      ...f,
      titulos: Array.from(f.titulos).slice(0, 3),
      urls: Array.from(f.urls),
    })),
    conexiones,
    totales: {
      estudiantes: estudiantes.size,
      queries: queries.size,
      fuentes: fuentes.size,
      busquedas: filas.reduce((s, f) => s + (f.busquedas_web || 0), 0),
    },
  });
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

  // Aplicar migraciones automaticas (agrega columnas nuevas si faltan)
  try {
    await migrarSiEsNecesario();
  } catch (error) {
    console.error('  ⚠️  Error en migracion:', error.message);
  }

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
    console.log(`     GET  /api/actividad-vivo`);
    console.log(`     GET  /api/red-busquedas`);
    console.log('');
  });
}

iniciar();