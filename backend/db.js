import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// Pool de conexiones a MySQL
// El pool reutiliza conexiones en vez de abrir/cerrar a cada query.
// ============================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ia_detective',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Funcion helper para verificar la conexion al iniciar
export async function probarConexion() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

// ============================================
// Migracion automatica: agrega columnas nuevas si no existen
// (asi no necesitas borrar la BD cuando agregamos features)
// ============================================
export async function migrarSiEsNecesario() {
  const verificarColumna = async (tabla, columna) => {
    const [filas] = await pool.query(
      `SELECT COUNT(*) AS existe FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [tabla, columna]
    );
    return filas[0].existe > 0;
  };

  // Agregar columnas nuevas a conversaciones_chat si no existen
  const columnasNuevas = [
    { nombre: 'busquedas_web', tipo: 'INT DEFAULT 0' },
    { nombre: 'queries_busqueda', tipo: 'TEXT NULL' },
    { nombre: 'fuentes', tipo: 'TEXT NULL' },
    { nombre: 'ip_cliente', tipo: 'VARCHAR(45) NULL' },
    { nombre: 'pais', tipo: 'VARCHAR(60) NULL' },
    { nombre: 'ciudad', tipo: 'VARCHAR(60) NULL' },
  ];

  for (const col of columnasNuevas) {
    const existe = await verificarColumna('conversaciones_chat', col.nombre);
    if (!existe) {
      await pool.query(
        `ALTER TABLE conversaciones_chat ADD COLUMN ${col.nombre} ${col.tipo}`
      );
      console.log(`  ✅ Migracion: columna ${col.nombre} agregada`);
    }
  }
}

// Funcion helper para registrar/actualizar a un estudiante
export async function registrarEstudiante(nombre) {
  if (!nombre || nombre.trim().length === 0) return null;
  const limpio = nombre.trim().substring(0, 50);

  await pool.query(
    `INSERT INTO estudiantes (nombre) VALUES (?)
     ON DUPLICATE KEY UPDATE ultima_actividad = NOW()`,
    [limpio]
  );

  const [filas] = await pool.query(
    'SELECT id FROM estudiantes WHERE nombre = ?',
    [limpio]
  );
  return filas[0]?.id || null;
}

export default pool;