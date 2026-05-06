// ============================================
// JUEGO 1: HUMANO o IA
// El estudiante debe adivinar quien lo escribio
// ============================================
export const preguntasHumanoIA = [
  {
    id: 1,
    tipo: 'texto',
    contenido: 'En las noches de invierno, mi abuela me preparaba un mate cocido con leche y un pedazo de pan duro mojado adentro. No era nada elegante, pero era lo más cálido del mundo.',
    autor: 'humano',
    explicacion: 'Las anécdotas con detalles muy específicos y emocionalmente vividos suelen ser humanas. La IA tiende a generalizar.',
  },
  {
    id: 2,
    tipo: 'texto',
    contenido: 'La inteligencia artificial representa un avance significativo en el campo de la tecnología, ofreciendo múltiples beneficios y oportunidades para el desarrollo de soluciones innovadoras en diversos ámbitos.',
    autor: 'ia',
    explicacion: 'Frase genérica, vacía y con palabras de relleno como "múltiples beneficios" y "diversos ámbitos". Marca clásica de texto generado.',
  },
  {
    id: 3,
    tipo: 'texto',
    contenido: 'Ayer perdí el bondi en la curva del Prado y tuve que pegarme un trote de tres cuadras. Llegué tarde igual y la profe me clavó una mirada que mata.',
    autor: 'humano',
    explicacion: 'Slang local boliviano ("bondi", "clavó una mirada"), nombres de lugares reales (Prado en Cochabamba) y errores de puntualidad cotidianos. Muy humano.',
  },
  {
    id: 4,
    tipo: 'texto',
    contenido: 'Es importante destacar que el aprendizaje continuo es fundamental para el éxito personal y profesional en el mundo actual. Cada experiencia nos brinda oportunidades únicas de crecimiento.',
    autor: 'ia',
    explicacion: 'Tono motivacional vacío, frases hechas, sin ninguna anécdota concreta. Es lo que se llama "ChatGPT-ese".',
  },
  {
    id: 5,
    tipo: 'texto',
    contenido: 'No sé qué hacer mañana en el examen de mate. Estudié pero igual me dan ganas de llorar. ¿Es normal sentirse así o solo me pasa a mí?',
    autor: 'humano',
    explicacion: 'Vulnerabilidad real, duda existencial pequeña y específica, pregunta dirigida a otra persona. Las IA rara vez se muestran vulnerables sin que se lo pidan.',
  },
  {
    id: 6,
    tipo: 'texto',
    contenido: 'El desayuno es considerado por muchos expertos como la comida más importante del día, ya que proporciona la energía necesaria para iniciar las actividades cotidianas con vitalidad.',
    autor: 'ia',
    explicacion: 'Apela a "muchos expertos" sin nombrar a ninguno, sin opinión propia, frases prefabricadas. Patrón típico de IA.',
  },
  {
    id: 7,
    tipo: 'texto',
    contenido: 'Mi gato se llama Tito y odia que le toque la pancita. Una vez le toqué y me clavó las uñas tan fuerte que sangré. Nunca más.',
    autor: 'humano',
    explicacion: 'Historia específica con un nombre propio, una consecuencia física concreta y una conclusión personal con humor. Muy humano.',
  },
  {
    id: 8,
    tipo: 'texto',
    contenido: 'La tecnología avanza a pasos agigantados, transformando la manera en que vivimos, trabajamos y nos relacionamos con el mundo que nos rodea de formas innovadoras.',
    autor: 'ia',
    explicacion: '"A pasos agigantados", "el mundo que nos rodea", "de formas innovadoras"… frases hechas en cadena. Bandera roja gigante.',
  },
  {
    id: 9,
    tipo: 'texto',
    contenido: 'A veces me pongo audífonos sin música solo para que no me hablen en el micro. ¿Soy la única que hace esto?',
    autor: 'humano',
    explicacion: 'Truco social específico, levemente raro, con duda genuina al final. Algo que la IA no inventa porque no tiene experiencia social.',
  },
  {
    id: 10,
    tipo: 'texto',
    contenido: 'En conclusión, podemos afirmar que la inteligencia emocional juega un papel crucial en el desarrollo integral del ser humano, permitiendo establecer relaciones más significativas y duraderas.',
    autor: 'ia',
    explicacion: '"En conclusión, podemos afirmar"… empezar así es señal segura de IA. Estructura de redacción escolar con plantilla.',
  },
];

// ============================================
// JUEGO 4: DILEMAS ETICOS
// El estudiante vota: SI / NO / DEPENDE
// ============================================
export const dilemasEticos = [
  {
    id: 'd1',
    titulo: 'El examen final',
    pregunta: '¿Debería una IA corregir y poner las notas finales del examen de bachillerato?',
    contexto: 'La IA es 30% más rápida que un profesor y supuestamente "objetiva", pero no entiende el contexto del estudiante.',
    icono: '📝',
    color: 'cyan',
  },
  {
    id: 'd2',
    titulo: 'El auto autónomo',
    pregunta: 'Un auto sin conductor debe elegir entre chocar contra 1 anciano o 3 niños. ¿La IA debería decidir esto sola?',
    contexto: 'Los autos autónomos ya existen. Alguien tiene que programar esa decisión antes de que ocurra.',
    icono: '🚗',
    color: 'magenta',
  },
  {
    id: 'd3',
    titulo: 'Tu mejor amigo IA',
    pregunta: '¿Está bien que alguien tenga a una IA como su mejor amigo o pareja?',
    contexto: 'Ya existen apps con millones de usuarios que tienen "novios/as IA". Algunos son adolescentes.',
    icono: '💬',
    color: 'lime',
  },
  {
    id: 'd4',
    titulo: 'IA en la policía',
    pregunta: '¿Debería la policía usar IA para predecir quién va a cometer un crimen antes de que ocurra?',
    contexto: 'Ya se usa en algunos países. Reduce delitos pero ha sido acusada de discriminar por barrio o color de piel.',
    icono: '👁️',
    color: 'orange',
  },
  {
    id: 'd5',
    titulo: 'Arte e IA',
    pregunta: '¿Es justo que una IA gane un concurso de arte contra artistas humanos?',
    contexto: 'Pasó de verdad: en 2022, una imagen hecha con IA ganó un concurso de arte digital en Colorado.',
    icono: '🎨',
    color: 'cyan',
  },
];

// ============================================
// JUEGO 2: ENTRENA TU IA
// Ejemplos para que el estudiante "entrene" un clasificador
// ============================================
export const ejemplosClasificador = {
  perro: [
    { id: 'p1', emoji: '🐕', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.7, lealtad: 1 } },
    { id: 'p2', emoji: '🐶', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.4, lealtad: 1 } },
    { id: 'p3', emoji: '🦮', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.8, lealtad: 1 } },
    { id: 'p4', emoji: '🐩', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.5, lealtad: 0.9 } },
  ],
  gato: [
    { id: 'g1', emoji: '🐈', caracteristicas: { ladra: 0, ronronea: 1, tamanio: 0.3, lealtad: 0.4 } },
    { id: 'g2', emoji: '🐱', caracteristicas: { ladra: 0, ronronea: 1, tamanio: 0.25, lealtad: 0.3 } },
    { id: 'g3', emoji: '🐈‍⬛', caracteristicas: { ladra: 0, ronronea: 1, tamanio: 0.3, lealtad: 0.5 } },
    { id: 'g4', emoji: '😼', caracteristicas: { ladra: 0, ronronea: 1, tamanio: 0.2, lealtad: 0.2 } },
  ],
  // Casos de prueba mistos
  pruebas: [
    { id: 't1', emoji: '🐕‍🦺', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.85, lealtad: 1 }, real: 'perro' },
    { id: 't2', emoji: '😻', caracteristicas: { ladra: 0, ronronea: 1, tamanio: 0.25, lealtad: 0.3 }, real: 'gato' },
    { id: 't3', emoji: '🐺', caracteristicas: { ladra: 1, ronronea: 0, tamanio: 0.9, lealtad: 0.5 }, real: 'perro' },
    { id: 't4', emoji: '🦁', caracteristicas: { ladra: 0, ronronea: 0.7, tamanio: 1, lealtad: 0.3 }, real: 'gato' },
  ],
};
