# 🔍 IA Detective

> Aplicación web fullstack interactiva para charlas de IA en colegios.
> Hecha para la presentación en el **Colegio San Agustín** de Cochabamba, Bolivia (carrera de IA · Universidad Central · 2026).

Cuatro experiencias para que los estudiantes de secundaria entiendan qué es la IA, cómo aprende, cómo conversa y cuáles son sus dilemas éticos.

---

## 🎯 ¿Qué hace?

| Módulo | Descripción |
|---|---|
| **01 · ¿Humano o IA?** | El estudiante lee 10 textos y adivina si los escribió una persona o una IA. Estadísticas en vivo del salón guardadas en MySQL. |
| **02 · Entrena tu IA** | Mini-clasificador visual: el estudiante "enseña" a una IA con ejemplos. Ve la red neuronal animarse y prueba con casos nuevos. |
| **03 · Chatea con Claude** | Chat real con la API de Claude (Anthropic). Cada mensaje se guarda en MySQL. |
| **04 · Dilemas éticos** | 5 dilemas reales. Vota y mira los resultados del salón en tiempo real (persistidos en BD). |
| **🎓 Panel del profesor** | QR para que los estudiantes se conecten + ranking en vivo desde MySQL + estadísticas. |

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS + Framer Motion + React Router |
| **Backend** | Node.js + Express |
| **Base de datos** | MySQL 8 (con `mysql2/promise`, pool de conexiones) |
| **IA** | Claude Opus 4.5 (Anthropic SDK oficial) |

---

## 🚀 Setup completo (paso a paso)

### Paso 1 · Requisitos previos

Antes de empezar, asegúrate de tener instalado:
- **Node.js 18+** → `node --version`
- **MySQL 8+** → `mysql --version`
- Tener una **API key de Claude** (https://console.anthropic.com/)

### Paso 2 · MySQL — verificar que está corriendo

```bash
# En Linux/Mac
sudo systemctl start mysql      # o "brew services start mysql"

# En Windows: abre "Servicios" y arranca MySQL, o usa XAMPP/WAMP

# Verifica que puedas entrar:
mysql -u root -p
```

### Paso 3 · Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` con tus datos:

```env
ANTHROPIC_API_KEY=sk-ant-tu-clave-real-aqui
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_de_mysql
DB_NAME=ia_detective
```

### Paso 4 · Crear la base de datos

```bash
# Desde la carpeta backend, ejecuta:
npm run init-db
```

Esto creará automáticamente la base de datos `ia_detective` con todas sus tablas. Verás algo como:

```
✅ Base de datos lista. Tablas creadas:
   • conversaciones_chat
   • estudiantes
   • respuestas_humano_ia
   • votos_dilemas
```

> Si prefieres ejecutar el SQL a mano, usa: `mysql -u root -p < database/schema.sql`

### Paso 5 · Encender el backend

```bash
cd backend
npm start
```

Verás:
```
✅ MySQL conectado
✅ API key: configurada
✅ Servidor en http://localhost:3001
```

### Paso 6 · Encender el frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Te dará:
```
Local:   http://localhost:5173
Network: http://192.168.x.x:5173   ← ESTA es para los celulares
```

---

## 📱 Cómo se usa en la charla

1. En el **laptop del profesor**, abre `http://localhost:5173/profesor` y proyéctalo en pantalla.
2. Los **estudiantes escanean el QR** desde su celular (todos en la misma WiFi del colegio).
3. Cada uno pone su nombre/apodo y juega.
4. El profesor ve el **ranking en vivo** y puede reiniciar la sesión cuando quiera.

---

## 📊 Esquema de la base de datos

```
estudiantes              → quienes se conectaron (nombre único)
respuestas_humano_ia     → cada respuesta del juego 1
votos_dilemas            → cada voto de los dilemas éticos (un voto por estudiante por dilema)
conversaciones_chat      → todos los mensajes con la IA (con tokens consumidos)
vista_ranking            → vista que calcula el top de estudiantes con más puntos
```

---

## 📁 Estructura del proyecto

```
ia-detective/
├── database/
│   └── schema.sql              # SQL para crear las tablas
│
├── backend/                    # Node + Express + MySQL + Claude
│   ├── server.js               # API REST con todos los endpoints
│   ├── db.js                   # Pool de conexiones a MySQL
│   ├── init-db.js              # Script para crear la BD automáticamente
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css           # Estilos brutalistas + animaciones
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Inicio.jsx
│   │   │   ├── HumanoOIA.jsx
│   │   │   ├── EntrenaIA.jsx
│   │   │   ├── ChatIA.jsx
│   │   │   ├── DilemaEtico.jsx
│   │   │   └── ProfesorPanel.jsx
│   │   └── data/
│   │       └── contenido.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor + conexión BD + estudiantes conectados |
| `POST` | `/api/chat` | Chatear con Claude (guarda mensaje en `conversaciones_chat`) |
| `POST` | `/api/humano-o-ia/responder` | Registra respuesta en `respuestas_humano_ia` |
| `POST` | `/api/dilema/votar` | Inserta voto en `votos_dilemas` (UNIQUE por estudiante+dilema) |
| `GET` | `/api/dilema/resultados/:dilemaId` | Conteo agregado de votos |
| `GET` | `/api/ranking` | Top 10 desde la vista `vista_ranking` |
| `POST` | `/api/reset` | Vacía todas las tablas |

---

## 🎨 Diseño

- **Estilo**: brutalista digital (bordes duros, sombras desplazadas, paleta cruda).
- **Tipografías**: Space Grotesk (display) + JetBrains Mono (mono) + Inter (cuerpo).
- **Paleta**: tinta oscura (`#0a0a0f`) + bone (`#f5f1e8`) con acentos neón (lime, cyan, magenta, naranja).
- **100% responsive** (mobile, tablet, desktop).

---

## 🐛 Troubleshooting

### "Access denied for user 'root'@'localhost'"
- Tu contraseña en `.env` está mal. Verifica con: `mysql -u root -p`
- En MySQL 8 a veces la auth es `caching_sha2_password`. Si tienes problemas:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_password';
  FLUSH PRIVILEGES;
  ```

### "ECONNREFUSED ::1:3306"
- MySQL no está corriendo. Arrancalo:
  - Linux: `sudo systemctl start mysql`
  - Mac: `brew services start mysql`
  - Windows: arranca el servicio "MySQL" desde Servicios

### "Unknown database 'ia_detective'"
- Falta correr `npm run init-db` desde la carpeta backend.

### El chat no responde
- Verifica que `ANTHROPIC_API_KEY` en `.env` sea correcta.
- Mira la consola del backend para ver el error exacto.

### Los celulares no se conectan
- Usa la IP de red (`192.168.x.x`), NO `localhost`.
- Verifica que estén en la misma WiFi.
- Si es un firewall, abre el puerto 5173 (frontend) y 3001 (backend).

---

## 💡 Tips para la presentación

1. **Prepara la WiFi**: todos en la misma red, sin restricciones del colegio.
2. **Arranca todo 10 min antes**: backend → init-db → frontend → abre `/profesor`.
3. **Pídeles que pongan su nombre**: dispara la competencia por el ranking.
4. **5 minutos por módulo**: marca el ritmo, no los dejes divagar.
5. **Cierra con dilemas éticos**: es el momento más emocionante para debatir en el salón.

---

Hecho con ❤️ y 🤖 en Cochabamba, Bolivia.
