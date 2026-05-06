-- ============================================
-- IA DETECTIVE - Base de datos
-- Charla Colegio San Agustin - Cochabamba 2026
-- ============================================

-- Crear base de datos (ejecuta esto solo si no existe)
CREATE DATABASE IF NOT EXISTS ia_detective
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ia_detective;

-- ============================================
-- TABLA: estudiantes
-- Lleva registro de quien se conecta a la sesion
-- ============================================
DROP TABLE IF EXISTS estudiantes;
CREATE TABLE estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  primera_conexion DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: respuestas_humano_ia
-- Cada vez que un estudiante responde una pregunta del juego 1
-- ============================================
DROP TABLE IF EXISTS respuestas_humano_ia;
CREATE TABLE respuestas_humano_ia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NULL,
  nombre_estudiante VARCHAR(50) NULL,
  pregunta_id INT NOT NULL,
  respuesta VARCHAR(10) NOT NULL,         -- 'humano' o 'ia'
  correcto BOOLEAN NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE SET NULL,
  INDEX idx_pregunta (pregunta_id),
  INDEX idx_estudiante (estudiante_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: votos_dilemas
-- Votos en los dilemas eticos
-- ============================================
DROP TABLE IF EXISTS votos_dilemas;
CREATE TABLE votos_dilemas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NULL,
  nombre_estudiante VARCHAR(50) NULL,
  dilema_id VARCHAR(20) NOT NULL,
  voto VARCHAR(10) NOT NULL,              -- 'si', 'no', 'depende'
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE SET NULL,
  INDEX idx_dilema (dilema_id),
  -- Un estudiante solo puede votar una vez por dilema
  UNIQUE KEY uk_voto_unico (nombre_estudiante, dilema_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: conversaciones_chat
-- Historial de mensajes con la IA
-- ============================================
DROP TABLE IF EXISTS conversaciones_chat;
CREATE TABLE conversaciones_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NULL,
  nombre_estudiante VARCHAR(50) NULL,
  rol VARCHAR(15) NOT NULL,               -- 'usuario' o 'asistente'
  mensaje TEXT NOT NULL,
  tokens_entrada INT NULL,
  tokens_salida INT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE SET NULL,
  INDEX idx_estudiante_tiempo (estudiante_id, creado_en)
) ENGINE=InnoDB;

-- ============================================
-- VISTA: ranking_estudiantes
-- Top de estudiantes con mas aciertos
-- ============================================
DROP VIEW IF EXISTS vista_ranking;
CREATE VIEW vista_ranking AS
SELECT
  e.id,
  e.nombre,
  COUNT(r.id) AS total_respuestas,
  SUM(CASE WHEN r.correcto THEN 1 ELSE 0 END) AS aciertos,
  SUM(CASE WHEN r.correcto THEN 10 ELSE 0 END) AS puntos
FROM estudiantes e
LEFT JOIN respuestas_humano_ia r ON r.nombre_estudiante = e.nombre
GROUP BY e.id, e.nombre
ORDER BY puntos DESC, e.nombre ASC;

-- ============================================
-- DATOS INICIALES (opcional, para probar)
-- ============================================
-- INSERT INTO estudiantes (nombre) VALUES
--   ('Demo_Cami'),
--   ('Demo_Lucho');

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 'Base de datos lista ✅' AS estado;
SHOW TABLES;
