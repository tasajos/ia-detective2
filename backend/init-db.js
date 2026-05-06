// ============================================
// Inicializa la base de datos ejecutando schema.sql
// Uso: npm run init-db
// ============================================
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inicializar() {
  console.log('\n🔧 Inicializando base de datos IA Detective...\n');

  // Conectar SIN especificar database (porque la creamos desde el SQL)
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    // Leer y ejecutar el archivo schema.sql
    const sqlPath = join(__dirname, '..', 'database', 'schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('  ▸ Ejecutando schema.sql...');
    await conn.query(sql);

    console.log('  ▸ Verificando tablas...');
    await conn.query(`USE ${process.env.DB_NAME || 'ia_detective'}`);
    const [tablas] = await conn.query('SHOW TABLES');

    console.log('\n✅ Base de datos lista. Tablas creadas:');
    tablas.forEach(t => console.log(`   • ${Object.values(t)[0]}`));
    console.log('\nYa puedes correr: npm start\n');
  } catch (error) {
    console.error('\n❌ Error inicializando la base de datos:');
    console.error('   ', error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. MySQL esté corriendo (mysql --version)');
    console.error('   2. Las credenciales en .env sean correctas');
    console.error('   3. El usuario tenga permisos para crear bases de datos\n');
    process.exit(1);
  } finally {
    await conn.end();
  }
}

inicializar();
